const axios = require('axios');
const cheerio = require('cheerio');

async function snackDownloader(url) {
    try {
        const response = await axios.get(url, { maxRedirects: 0 });
        if (response.status !== 200) {
            return {
                creator: '@ShiroNexo',
                status: false,
                message: "Failed to get data from URL"
            }
        }

        const html = response.data;
        const $ = cheerio.load(html);

        const scriptElement = $('#VideoObject');
        if (scriptElement.length === 0) {
            return {
                creator: '@ShiroNexo',
                status: false,
                message: "Elemen <script> with ID 'VideoObject' not found"
            }
        }

        const scriptContent = scriptElement.html();
        const videoData = JSON.parse(scriptContent);

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                author: videoData.creator.mainEntity.name,
                description: videoData.description,
                transcript: videoData.transcript,
                thumbnailUrl: videoData.thumbnailUrl,
                uploadDate: videoData.uploadDate,
                comment: videoData.commentCount,
                audio: videoData.audio,
                result: videoData.contentUrl
            }
        }
    } catch (error) {
        console.error(error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'Unknown error'
        }
    }
}

module.exports = snackDownloader