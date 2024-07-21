const axios = require('axios');

async function sfileDownloader(url) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
        'Referer': url,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    };

    try {
        const response = await axios.get(url, { headers });
        let cookieValue = response.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');

        headers.Cookie = cookieValue;

        const html = response.data;

        const filename = html.match(/<h1 class="intro">(.*?)<\/h1>/s)?.[1] || '';
        const mimetype = html.match(/<div class="list">.*? - (.*?)<\/div>/)?.[1] || '';
        const downloadUrl = html.match(/<a class="w3-button w3-blue w3-round" id="download" href="([^"]+)"/)?.[1];
        headers.Referer = downloadUrl;

        if (!downloadUrl) return { creator: '@ShiroNexo', status: false, message: 'Download URL not found' };

        const response2 = await axios.get(downloadUrl, { headers });
        const html2 = response2.data;
        
        const finalDownloadUrl = html2.match(/<a class="w3-button w3-blue w3-round" id="download" href="([^"]+)"/)?.[1];
        const key = html2.match(/&k='\+(.*?)';/)?.[1].replace(`'`, '')
        const finalUrl = finalDownloadUrl + (key ? `&k=${key}` : '');

        // Extract the filesize
        const filesize = html2.match(/Download File \((.*?)\)/)?.[1];

        if (!finalUrl) return { creator: '@ShiroNexo', status: false, message: 'Download URL not found' };
        const data = await downloadFile(finalUrl, url);

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                filename,
                filesize,
                mimetype,
                result: data
            }
        };
    } catch (err) {
        console.error("Error:", err);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: err.message || 'Unknown error'
        }
    }
}

async function downloadFile(url, trueUrl) {
    try {
        const response = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 303,
            headers: {
                'Referer': trueUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47'
            },
        });

        const cookies = response.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
        const redirectUrl = response.headers.location;

        const response2 = await axios.get(redirectUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Referer': trueUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
                'Cookie': cookies,
            },
        });;

        const filename = response2.headers['content-disposition']?.match(/filename=["']?([^"';]+)["']?/)?.[1] || 'unknown';
        const mimeType = response2.headers['content-type'];
        const fileBuffer = Buffer.from(response2.data);

        return {
            filename,
            mimeType,
            buffer: fileBuffer
        };
    } catch (error) {
        throw error;
    }
}

module.exports = sfileDownloader