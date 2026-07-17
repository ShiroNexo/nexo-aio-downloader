const axios = require('axios');
const { successResponse, errorResponse } = require('./utils');

async function sfileDownloader(url) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
        Referer: url,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    };

    try {
        const response = await axios.get(url, { headers });
        const cookieValue = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        headers.Cookie = cookieValue;

        const html = response.data;

        const filename = html.match(/<h1 class="intro">(.*?)<\/h1>/s)?.[1]
            || html.match(/<title>(.*?)<\/title>/)?.[1]?.replace(/^Download\s+/, '')
            || '';
        const mimetype = html.match(/<div class="list">.*? - (.*?)<\/div>/)?.[1] || '';
        const downloadUrl = html.match(/<a[^>]*id="download"[^>]*href="([^"]+)"/)?.[1];
        const dwUrl = html.match(/data-dw-url="([^"]+)"/)?.[1];

        if (!downloadUrl && !dwUrl) return errorResponse('Download URL not found');

        if (dwUrl) {
            headers.Referer = dwUrl;
            const data = await downloadFile(dwUrl, url);
            const size = html.match(/Download File \((.*?)\)/)?.[1] || '';
            return successResponse({ filename, filesize: size, mimetype, result: data.buffer });
        }

        headers.Referer = downloadUrl;
        const response2 = await axios.get(downloadUrl, { headers });
        const html2 = response2.data;

        const finalUrl = html2.match(/<a[^>]*id="download"[^>]*href="([^"]+)"/)?.[1] || '';
        const key = html2.match(/&k='\+(.*?)';/)?.[1]?.replace(`'`, '');
        const finalDownloadUrl = finalUrl + (key ? `&k=${key}` : '');
        const filesize = html2.match(/Download File \((.*?)\)/)?.[1];

        if (!finalDownloadUrl) return errorResponse('Download URL not found');

        const data = await downloadFile(finalDownloadUrl, url);

        return successResponse({ filename, filesize, mimetype, result: data.buffer });
    } catch (err) {
        console.error('Error:', err);
        return errorResponse(err.message || 'Unknown error');
    }
}

async function downloadFile(url, trueUrl) {
    try {
        const response = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 303,
            headers: {
                Referer: trueUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
            },
        });

        const redirectUrl = response.headers.location;

        if (redirectUrl) {
            const cookies = response.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
            const response2 = await axios.get(redirectUrl, {
                responseType: 'arraybuffer',
                headers: {
                    Referer: trueUrl,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
                    Cookie: cookies,
                },
            });

            const filename = response2.headers['content-disposition']?.match(/filename=["']?([^"';]+)["']?/)?.[1] || 'unknown';
            const mimeType = response2.headers['content-type'];
            return { filename, mimeType, buffer: Buffer.from(response2.data) };
        }

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
            const html = response.data;
            const fileUrl =
                html.match(/href="([^"]+)"[^>]*class="[^"]*download[^"]*"/i)?.[1]
                || html.match(/data-url="([^"]+)"/)?.[1]
                || html.match(/<a[^>]*href="([^"]+)"[^>]*>Download\s*</i)?.[1];

            if (fileUrl) {
                const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : new URL(fileUrl, url).href;
                const fileResponse = await axios.get(resolvedUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        Referer: trueUrl,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
                    },
                });

                const filename = fileResponse.headers['content-disposition']?.match(/filename=["']?([^"';]+)["']?/)?.[1] || 'unknown';
                const mimeType = fileResponse.headers['content-type'];
                return { filename, mimeType, buffer: Buffer.from(fileResponse.data) };
            }
        }

        return { filename: 'unknown', mimeType: contentType, buffer: Buffer.from(response.data) };
    } catch (error) {
        throw error;
    }
}

module.exports = sfileDownloader;
