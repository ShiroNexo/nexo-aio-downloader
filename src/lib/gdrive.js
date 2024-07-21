const axios = require('axios');
const cheerio = require('cheerio');

async function gdriveDownloader(url) {
    const id = filterID(url);
    console.log(id);

    try {
        const response = await axios.get(`https://drive.usercontent.google.com/download?id=${id}&export=download`, {
            responseType: 'arraybuffer',
            headers: { 'Accept-Encoding': 'gzip, deflate, br' },
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 300
        });

        // Cek apakah respons adalah file yang langsung diunduh
        if (response.headers['content-disposition']) {
            const filename = getFilenameFromHeader(response.headers['content-disposition']);
            const filesize = formatFileSize(response.headers['content-length']);
            
            return {
                creator: '@ShiroNexo',
                status: true,
                data: {
                    filename,
                    filesize,
                    result: response.data
                }
            };
        }

        // Jika bukan file langsung, proses HTML
        const htmlContent = Buffer.from(response.data).toString('utf-8');
        const $ = cheerio.load(htmlContent);

        let query = '';
        $('input[type="hidden"]').each((i, elem) => {
            const name = $(elem).attr('name');
            const value = $(elem).val();
            query += `${name}=${value}&`;
        });

        const filename = $('span.uc-name-size a').text().trim();

        const directDownloadUrl = `https://drive.usercontent.google.com/download?${query}`;

        const buffer = await axios.get(directDownloadUrl, {
            responseType: 'arraybuffer',
        });

        const filesize = formatFileSize(buffer.headers['content-length']);

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                filename,
                filesize,
                result: buffer.data
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

const filterID = (url) => {
    return url.match(/(?:https?:\/\/drive\.google\.com\/(?:file\/d\/|uc\?id=|open\?id=))?(?<id>[-\w]{25,})/)?.groups?.id
}

function getFilenameFromHeader(header) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(header);
    if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
    }
    return 'unknown';
}

function formatFileSize(bytes) {
    if (!bytes) return 'unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

module.exports = gdriveDownloader