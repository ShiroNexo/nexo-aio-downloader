const axios = require('axios');
const cheerio = require('cheerio');
const { successResponse, errorResponse } = require('./utils');

async function snackDownloader(url) {
    try {
        const response = await axios.get(url, { maxRedirects: 0 });
        if (response.status !== 200) return errorResponse('Failed to get data from URL');

        const $ = cheerio.load(response.data);
        const scriptElement = $('#VideoObject');
        if (scriptElement.length === 0) return errorResponse("Element <script> with ID 'VideoObject' not found");

        const videoData = JSON.parse(scriptElement.html());

        return successResponse({
            author: videoData.creator.mainEntity.name,
            description: videoData.description,
            transcript: videoData.transcript,
            thumbnailUrl: videoData.thumbnailUrl,
            uploadDate: videoData.uploadDate,
            comment: videoData.commentCount,
            audio: videoData.audio,
            result: videoData.contentUrl,
        });
    } catch (error) {
        console.error(error);
        return errorResponse(error.message || 'Unknown error');
    }
}

module.exports = snackDownloader;
