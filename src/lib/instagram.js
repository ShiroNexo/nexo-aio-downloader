const axios = require('axios');
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

async function instagramDownloader(url, proxy = null) {
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
        console.error('Instagram Downloader Error:\n', error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message
        };
    }
};

module.exports = instagramDownloader;