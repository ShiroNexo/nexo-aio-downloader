const axios = require('axios');
const cheerio = require('cheerio');
const { successResponse, errorResponse, formatFileSize, parseFilenameFromHeader } = require('./utils');

async function gdriveDownloader(url) {
    const id = filterID(url);
    if (!id) return errorResponse('Invalid Google Drive URL');

    try {
        const response = await axios.get(`https://drive.usercontent.google.com/download?id=${id}&export=download`, {
            responseType: 'arraybuffer',
            headers: { 'Accept-Encoding': 'gzip, deflate, br' },
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 300,
        });

        if (response.headers['content-disposition']) {
            return successResponse({
                filename: parseFilenameFromHeader(response.headers['content-disposition']),
                filesize: formatFileSize(response.headers['content-length']),
                result: response.data,
            });
        }

        const htmlContent = Buffer.from(response.data).toString('utf-8');
        const $ = cheerio.load(htmlContent);

        let query = '';
        $('input[type="hidden"]').each((i, elem) => {
            const name = $(elem).attr('name');
            const value = $(elem).val();
            query += `${name}=${value}&`;
        });

        const filename = $('span.uc-name-size a').text().trim();

        const buffer = await axios.get(`https://drive.usercontent.google.com/download?${query}`, {
            responseType: 'arraybuffer',
        });

        return successResponse({
            filename,
            filesize: formatFileSize(buffer.headers['content-length']),
            result: buffer.data,
        });
    } catch (err) {
        console.error('Error:', err);
        return errorResponse(err.message || 'Unknown error');
    }
}

function filterID(url) {
    return url.match(/(?:https?:\/\/drive\.google\.com\/(?:file\/d\/|uc\?id=|open\?id=))?(?<id>[-\w]{25,})/)?.groups?.id;
}

module.exports = gdriveDownloader;
