const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const { successResponse, errorResponse } = require('./utils');

class InstagramScraper {
    constructor(cookie = '') {
        this.axiosInstance = axios.create({
            baseURL: 'https://www.instagram.com/api/graphql',
            headers: {
                'Accept-Language': 'en-US,en;q=0.5',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-FB-Friendly-Name': 'PolarisPostActionLoadPostQueryQuery',
                'X-CSRFToken': 'RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52',
                'X-IG-App-ID': '1217981644879628',
                'X-FB-LSD': 'AVqbxe3J_YA',
                'X-ASBD-ID': '129477',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                ...(cookie ? { Cookie: cookie } : {}),
            },
        });

        this.fallbackAxios = axios.create({
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'upgrade-insecure-requests': '1',
                ...(cookie ? { cookie } : {}),
            },
            timeout: 10000,
        });
    }

    getInstagramPostId(url) {
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|tv|stories|reel|reels)\/([^/?#&]+).*/);
        return match ? match[1] : null;
    }

    encodeGraphqlRequestData(shortcode) {
        return qs.stringify({
            lsd: 'AVqbxe3J_YA',
            jazoest: '2957',
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'PolarisPostActionLoadPostQueryQuery',
            variables: JSON.stringify({ shortcode }),
            doc_id: '10015901848480474',
        });
    }

    async getPostGraphqlData(postId) {
        const response = await this.axiosInstance.post('', this.encodeGraphqlRequestData(postId));
        return response.data;
    }

    extractPostInfo(mediaData) {
        if (!mediaData) throw new Error('Data media tidak tersedia dari GraphQL');
        const getUrlFromData = data => {
            if (data.edge_sidecar_to_children) {
                return data.edge_sidecar_to_children.edges.map(edge => edge.node.video_url || edge.node.display_url);
            }
            return data.video_url ? [data.video_url] : [data.display_url];
        };
        return {
            url: getUrlFromData(mediaData),
            metadata: {
                caption: mediaData.edge_media_to_caption?.edges[0]?.node.text || '',
                username: mediaData.owner?.username || 'unknown',
                like: mediaData.edge_media_preview_like?.count || 0,
                comment: mediaData.edge_media_to_comment?.count || 0,
                isVideo: mediaData.is_video || false,
            },
        };
    }

    findMediaItems(obj) {
        const str = JSON.stringify(obj);
        if (!str.includes('xdt_api__v1__media__shortcode__web_info')) return null;

        try {
            const entry = obj.require?.[0]?.[3]?.[0]?.__bbox?.require?.[0]?.[3]?.[1]?.__bbox?.result?.data;
            if (entry?.xdt_api__v1__media__shortcode__web_info?.items) {
                return entry.xdt_api__v1__media__shortcode__web_info.items[0];
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    extractFallbackInfo(mediaItem) {
        if (!mediaItem) throw new Error('Data media tidak tersedia dari Fallback');

        let urls = [];

        if (mediaItem.carousel_media && mediaItem.carousel_media.length > 0) {
            urls = mediaItem.carousel_media.map(item => {
                if (item.video_versions && item.video_versions.length > 0) {
                    return item.video_versions[0].url;
                } else if (item.image_versions2 && item.image_versions2.candidates.length > 0) {
                    return item.image_versions2.candidates[0].url;
                }
            }).filter(Boolean);
        } else {
            if (mediaItem.video_versions && mediaItem.video_versions.length > 0) {
                urls.push(mediaItem.video_versions[0].url);
            } else if (mediaItem.image_versions2 && mediaItem.image_versions2.candidates.length > 0) {
                urls.push(mediaItem.image_versions2.candidates[0].url);
            }
        }

        return {
            url: urls,
            metadata: {
                caption: mediaItem.caption?.text || '',
                username: mediaItem.user?.username || 'unknown',
                like: mediaItem.like_count || 0,
                comment: mediaItem.comment_count || 0,
                isVideo: !!mediaItem.video_versions,
            },
        };
    }

    async getPostFallbackData(url) {
        const response = await this.fallbackAxios.get(url);
        const $ = cheerio.load(response.data);
        let foundData = null;

        $('script[type="application/json"][data-sjs]').each((i, el) => {
            const content = $(el).html();
            if (content.includes('xdt_api__v1__media__shortcode__web_info')) {
                try {
                    const parsed = JSON.parse(content);
                    const item = this.findMediaItems(parsed);
                    if (item) foundData = item;
                } catch (e) {}
            }
        });

        return foundData;
    }

    async fetchData(url) {
        const postId = this.getInstagramPostId(url);
        if (!postId) throw new Error('URL Instagram tidak valid');

        try {
            console.log('Mencoba fetch data melalui GraphQL...');
            const data = await this.getPostGraphqlData(postId);

            if (data?.data?.xdt_shortcode_media) {
                return this.extractPostInfo(data.data.xdt_shortcode_media);
            }
            throw new Error('Data dari GraphQL kosong / Diblokir.');
        } catch (error) {
            console.log(`GraphQL gagal (${error.message}). Beralih ke metode fallback...`);

            try {
                const fallbackData = await this.getPostFallbackData(url);
                if (fallbackData) return this.extractFallbackInfo(fallbackData);
                throw new Error('Gagal menemukan struktur media di HTML fallback.');
            } catch (fallbackError) {
                throw new Error(`Semua metode gagal. Error Fallback: ${fallbackError.message}`);
            }
        }
    }
}

async function instagramDownloader(url, cookie = '') {
    try {
        const scraper = new InstagramScraper(cookie);
        const result = await scraper.fetchData(url);
        return successResponse({
            url: result.url,
            caption: result.metadata.caption,
            username: result.metadata.username,
            like: result.metadata.like,
            comment: result.metadata.comment,
            isVideo: result.metadata.isVideo,
        });
    } catch (error) {
        return errorResponse(error.message);
    }
}

module.exports = instagramDownloader;
