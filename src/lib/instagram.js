const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

const HEADERS = {
    Accept: '*/*',
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
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36'
};

function getInstagramPostId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|tv|reel)\/([^/?#&]+).*/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

function encodeGraphqlRequestData(shortcode) {
    const requestData = {
        av: "0",
        __d: "www",
        __user: "0",
        __a: "1",
        __req: "3",
        __hs: "19624.HYP:instagram_web_pkg.2.1..0.0",
        dpr: "3",
        __ccg: "UNKNOWN",
        __rev: "1008824440",
        __s: "xf44ne:zhh75g:xr51e7",
        __hsi: "7282217488877343271",
        __dyn: "7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78b87C0yE5ufz81s8hwGwQwoEcE7O2l0Fwqo31w9a9x-0z8-U2zxe2GewGwso88cobEaU2eUlwhEe87q7-0iK2S3qazo7u1xwIw8O321LwTwKG1pg661pwr86C1mwraCg",
        __csr: "gZ3yFmJkillQvV6ybimnG8AmhqujGbLADgjyEOWz49z9XDlAXBJpC7Wy-vQTSvUGWGh5u8KibG44dBiigrgjDxGjU0150Q0848azk48N09C02IR0go4SaR70r8owyg9pU0V23hwiA0LQczA48S0f-x-27o05NG0fkw",
        __comet_req: "7",
        lsd: "AVqbxe3J_YA",
        jazoest: "2957",
        __spin_r: "1008824440",
        __spin_b: "trunk",
        __spin_t: "1695523385",
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
        variables: JSON.stringify({
            shortcode: shortcode,
            fetch_comment_count: null,
            fetch_related_profile_media_count: null,
            parent_comment_count: null,
            child_comment_count: null,
            fetch_like_count: null,
            fetch_tagged_user_count: null,
            fetch_preview_comment_count: null,
            has_threaded_comments: false,
            hoisted_comment_id: null,
            hoisted_reply_id: null,
        }),
        server_timestamps: "true",
        doc_id: "10015901848480474",
    };

    return qs.stringify(requestData);
};

async function getPostGraphqlData(postId, proxy) {
    try {
        const encodedData = encodeGraphqlRequestData(postId);
        const response = await axios.post('https://www.instagram.com/api/graphql', encodedData, { headers: HEADERS, httpsAgent: proxy });
        return response.data;
    } catch (error) {
        throw error;
    }
};

function extractPostInfo(mediaData) {
    try {
        const getUrlFromData = (data) => {
            if (data.edge_sidecar_to_children) {
                return data.edge_sidecar_to_children.edges
                    .map(edge => edge.node.video_url || edge.node.display_url);
            }
            return data.video_url ? [data.video_url] : [data.display_url];
        };

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                url: getUrlFromData(mediaData),
                caption: mediaData.edge_media_to_caption.edges[0]?.node.text || null,
                username: mediaData.owner.username,
                like: mediaData.edge_media_preview_like.count,
                comment: mediaData.edge_media_to_comment.count,
                isVideo: mediaData.is_video,
            }
        };
    } catch (error) {
        throw error;
    }
};

async function directScrape(url, proxy = null) {
    try {
        const postId = getInstagramPostId(url);
        if (!postId) {
            throw new Error('Invalid Instagram URL');
        }

        const data = await getPostGraphqlData(postId, proxy);
        const mediaData = data.data?.xdt_shortcode_media;

        if (!mediaData) {
            return null;
        }

        return extractPostInfo(mediaData);
    } catch (error) {
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message
        };
    }
};

const varHeaders = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'sec-ch-prefers-color-scheme': 'light',
    'sec-ch-ua': '"Chromium";v="110", "Not A(Brand";v="24", "Microsoft Edge";v="110"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/124.0.0.0',
};

let grapHeaders = {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Dnt': '1',
    'Pragma': 'no-cache',
    'Referer': '',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'X-Csrftoken': 'EuZcvVSeiRAC60CJQRrRC6',
    'X-Ig-App-Id': '936619743392459',
    'X-Ig-Www-Claim': '0',
    'X-Requested-With': 'XMLHttpRequest'
}

async function userGraphql(url) {
    try {
        let body = await axios.get(url, {
            headers: varHeaders,
        }).then(res => res.data)
        
        let user_id = body.match(/<meta\s+property="instapp:owner_user_id"\s+content="(\d+)"/)[1]
        let video_id = body.match(/instagram:\/\/media\?id=(\d+)/)[1]

        const graphUrl = `https://www.instagram.com/graphql/query/?doc_id=7571407972945935&variables=%7B%22id%22%3A%22${user_id}%22%2C%22include_clips_attribution_info%22%3Afalse%2C%22first%22%3A1000%7D`

        console.log('graphUrl: ', graphUrl)
        const graph = await axios.get(graphUrl, {
            method: 'GET',
            headers: grapHeaders,
            httpsAgent: httpsProxyAgent
        }).then(response => response.data)

        // Ambil video dari respons
        const edges = graph.data.user.edge_owner_to_timeline_media.edges;
        let videoData = edges.find(edge => edge.node.id === video_id);

        if (!videoData) {
            return {
                creator: '@ShiroNexo',
                status: false,
                message: 'Video not found'
            };
        }

        // Memastikan bahwa videoData.node ada
        videoData = videoData.node;

        const getUrlFromData = (videoData) => {
            // Jika videoData memiliki edge_sidecar_to_children, ambil semua video URLs dari children
            if (videoData.edge_sidecar_to_children) {
                return videoData.edge_sidecar_to_children.edges
                    .map(edge => edge.node.video_url || edge.node.display_url); // Ambil video_url dari setiap video
            }
        
            // Jika tidak ada edge_sidecar_to_children, gunakan video_url dari videoData
            return videoData.video_url ? [videoData.video_url] : [ videoData.display_url ];
        };

        const listUrl = getUrlFromData(videoData)

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                url: listUrl,
                caption: videoData['edge_media_to_caption']['edges'].length > 0 ? videoData['edge_media_to_caption']['edges'][0]['node']['text'] : null,
                username: videoData['owner']['username'],
                like: videoData['edge_media_preview_like']['count'],
                comment: videoData['edge_media_to_comment']['count'],
                isVideo: videoData['is_video'],
            }
        };
    } catch (error) {
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message
        };
    }
}

async function saveIG(query) {
    try {
        // Konfigurasi permintaan ke API saveig.app
        const requestData = {
            q: query,
            t: 'media',
            lang: 'en'
        };

        const requestHeaders = {
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/x-www-form-urlencoded',
            Origin: 'https://saveig.app',
            Referer: 'https://saveig.app/en',
            'Sec-Ch-Ua': '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.183',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // Membuat instance axios dengan konfigurasi headers
        const axiosInstance = axios.create({ headers: requestHeaders });

        // Melakukan permintaan POST ke API
        const [response] = await Promise.all([
            axiosInstance.post('https://saveig.app/api/ajaxSearch', qs.stringify(requestData))
        ]);

        // Mengambil data dari respons
        const responseData = response.data;
        const htmlContent = responseData.data;

        // Memparsing HTML menggunakan cheerio
        const $ = cheerio.load(htmlContent);
        const downloadItems = $('.download-items');

        // Menyimpan hasil download link dan thumbnail
        const downloadLinks = [];
        downloadItems.each((index, element) => {
            const thumbnailLink = $(element).find('.download-items__thumb > img').attr('src');
            const downloadLink = $(element).find('.download-items__btn > a').attr('href');

            downloadLinks.push(downloadLink );
        });

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                url: downloadLinks,
                caption: null,
                username: null,
                like: null,
                comment: null,
                isVideo: null,
            }
        };
    } catch (error) {
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message
        };
    }
}

function extractData(script) {
    const regex = /downVideo\('([^']+)'.*?\.mp([34])/g;
    const regex2 = /window\.open\("([^"]+)"/g;

    let videoUrl = []
    
    let match;
    while ((match = regex.exec(script)) !== null) {
        const url = match[1];
        const fileType = match[2];
    
        if (fileType === '4') {
            videoUrl.push('https:' + url);
        } else if (fileType === '3') {
            videoUrl.push(url);
        }
    }

    while ((match = regex2.exec(script)) !== null) {
        const url = match[1];
        videoUrl.push(url);
    }

    return videoUrl
}

async function dlpanda(url) {
    try {
        let result = await axios.get(`https://dlpanda.com/instagram?url=${url}`).then(response => {
            return response.data
        })

        let downloadLinks =  extractData(result)
        if (downloadLinks.length === 0) {
            return {
                creator: '@ShiroNexo',
                status: false,
                message: 'No video found'
            };
        }

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                url: downloadLinks,
                caption: null,
                username: null,
                like: null,
                comment: null,
                isVideo: null,
            }
        };
    } catch (error) {
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message
        };
    }
}

async function instagramDownloader(text, Func) {
    const methods = [
        async () => {
            try {
                const data = await directScrape(text);
                if (!data.status) return null;

                return data
            } catch (error) {
                console.log(error)
                console.log("Error using method 1");
                return null;
            }
        },
        async () => {
            try {
                const data = await userGraphql(text);
                if (!data.status) return null;

                return data
            } catch (error) {
                console.log("Error using method 2");
                return null;
            }
        },
        async () => {
            try {
                const data = await saveIG(text);
                if (!data.status) return null;

                return data
            } catch (error) {
                console.log("Error using method 3");
                return null;
            }
        },
        async () => {
            try {
                const data = await dlpanda(text);
                if (!data.status) return null;

                return data
            } catch (error) {
                console.log("Error using method 4");
                return null;
            }
        },
    ];

    for (const method of methods) {
        const info = await method();
        if (info !== null && info.status) {
            return info;
        }
    }

    return {
        creator: '@ShiroNexo',
        status: false,
        message: 'All methods failed'
    };
}

module.exports = instagramDownloader;