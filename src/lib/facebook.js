const axios = require('axios');
const { successResponse, errorResponse, safeDecodeUrl } = require('./utils');

const varHeaders = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'cache-control': 'max-age=0',
    'sec-ch-prefers-color-scheme': 'light',
    'sec-ch-ua': '"Chromium";v="110", "Not A(Brand";v="24", "Microsoft Edge";v="110"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41',
};

async function facebookDownloader(url, proxy = null) {
    try {
        const response = await axios.get(url, { headers: varHeaders, httpsAgent: proxy }).then(res => res.data);
        return regexUrl(response);
    } catch (error) {
        return errorResponse(error.message || 'Something went wrong');
    }
}

function regexUrl(body) {
    const result = {
        user: null,
        quoted: null,
        isPrivate: false,
        result: [],
    };

    try {
        const urlRegex = /"playable_url":\s*"([^"]+)"/;
        const urlHdRegex = /"playable_url_quality_hd":\s*"([^"]+)"/;
        const nativeSD = /"browser_native_sd_url":\s*"([^"]+)"/;
        const nativeHD = /"browser_native_hd_url":\s*"([^"]+)"/;
        const regex = /"name":\s*"([^"]+)",\s*"id":\s*"[^"]+"\s*}\s*],\s*"creation_time":\s*\d+,\s*"seo_title":\s*("[^"]*"|null)/;
        const regex2 = /"name":"(#[^"]+)".*?"text":"(.*?)"/;

        const matches = regex.exec(body) || regex2.exec(body);
        if (matches) {
            const user = matches[1].replace(/"/g, '');
            let quoted = matches[2] === 'null' ? null : matches[2].replace(/"/g, '');
            if (quoted !== null) {
                quoted = decodeURIComponent(JSON.parse(`"${quoted}"`));
            }
            result.user = user;
            result.quoted = quoted;
        }

        const urlMatch = body.match(urlRegex);
        const urlHdMatch = body.match(urlHdRegex);
        const nativeSDMatch = body.match(nativeSD);
        const nativeHDMatch = body.match(nativeHD);

        if (urlHdMatch) result.result.push({ quality: 'HD', type: 'mp4', url: safeDecodeUrl(urlHdMatch[1]) });
        if (urlMatch) result.result.push({ quality: 'SD', type: 'mp4', url: safeDecodeUrl(urlMatch[1]) });
        if (nativeHDMatch) result.result.push({ quality: 'HD', type: 'mp4', url: safeDecodeUrl(nativeHDMatch[1]) });
        if (nativeSDMatch) result.result.push({ quality: 'SD', type: 'mp4', url: safeDecodeUrl(nativeSDMatch[1]) });

        if (result.result.length === 0 && body.includes('isprivate')) {
            console.log('- Private group');
            result.isPrivate = true;
        }

        console.log('- Download videos success');
        return successResponse(result);
    } catch (error) {
        console.error('facebook Downloader Error:\n', error);
        return errorResponse(error.message || 'Something went wrong');
    }
}

module.exports = facebookDownloader;
