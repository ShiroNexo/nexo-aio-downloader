const axios = require('axios');
const fs = require('fs');

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

const decodeUrl = url => JSON.parse(`"${url.replace(/\\\//g, "/")}"`);

async function facebookDownloader(url, proxy = null) {
    try {
        const response = await axios.get(url, { headers: varHeaders, httpsAgent: proxy }).then(res => res.data);
        const result = await regexUrl(response);

        return result
    } catch (error) {
        throw error
    }
}

module.exports = facebookDownloader;


async function regexUrl(body) {
    const result = {
        creator: '@ShiroNexo',
        status: true,
        data: {
            user: null,
            quoted: null,
            isPrivate: false,
            result: [],
        }
    };
    try {
        const urlRegex = /"playable_url":\s*"([^"]+)"/;
        const urlHdRegex = /"playable_url_quality_hd":\s*"([^"]+)"/;
        const nativeSD = /"browser_native_sd_url":\s*"([^"]+)"/;
        const nativeHD = /"browser_native_hd_url":\s*"([^"]+)"/;
        const regex = /"name":\s*"([^"]+)",\s*"id":\s*"[^"]+"\s*}\s*],\s*"creation_time":\s*\d+,\s*"seo_title":\s*("[^"]*"|null)/;
        const regex2 = /"name":"(#[^"]+)".*?"text":"(.*?)"/;

        let matches = regex.exec(body) || regex2.exec(body);
        if (matches) {
            const user = matches[1].replace(/"/g, '');
            let quoted = matches[2] === 'null' ? null : matches[2].replace(/"/g, '');
            if (quoted !== null) {
            quoted = decodeURIComponent(JSON.parse(`"${quoted}"`));
            }
            result.data.user = user;
            result.data.quoted = quoted;
        }

        const urlMatch = body.match(urlRegex);
        const urlHdMatch = body.match(urlHdRegex);
        const nativeSDMatch = body.match(nativeSD);
        const nativeHDMatch = body.match(nativeHD);

        if (urlHdMatch) {
            const urlDl = decodeUrl(urlHdMatch[1]);
            result.data.result.push({ quality: 'HD', type: 'mp4', url: urlDl });
        }

        if (urlMatch) {
            const urlDl = decodeUrl(urlMatch[1]);
            result.data.result.push({ quality: 'SD', type: 'mp4', url: urlDl });
        }

        if (nativeHDMatch) {
            const urlDl = decodeUrl(nativeHDMatch[1]);
            result.data.result.push({ quality: 'HD', type: 'mp4', url: urlDl });
        }

        if (nativeSDMatch) {
            const urlDl = decodeUrl(nativeSDMatch[1]);
            result.data.result.push({ quality: 'SD', type: 'mp4', url: urlDl });
        }

        if (result.data.result.length === 0 && body.includes('isprivate')) {
            console.log("- Private group");
            result.isPrivate = true;
        }

        console.log('- Download videos success');
        return result;
    } catch (error) {
        console.error('facebook Downloader Error:\n', error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'Something went wrong'
        }
    }
}