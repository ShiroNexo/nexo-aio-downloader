const axios = require('axios');
const cheerio = require('cheerio');
const { successResponse, errorResponse } = require('./utils');

async function getTemplateId(templateUrl) {
    try {
        const directIdMatch = templateUrl.match(/\/template-detail\/(?:[a-zA-Z0-9-]+)?\/(\d+)|\/templates\/(\d+)/);
        if (directIdMatch) return directIdMatch[1] || directIdMatch[2];

        const response = await axios.get(templateUrl, {
            maxRedirects: 5,
            validateStatus: status => status >= 200 && status < 400,
        });

        const redirectedUrl = response.request.res.responseUrl;
        if (redirectedUrl) {
            const numericMatch = redirectedUrl.match(/\/template-detail\/(?:[a-zA-Z0-9-]+)?\/(\d+)|\/templates\/(?:[a-zA-Z0-9-]+-)?(\d+)/);
            if (numericMatch) return numericMatch[1] || numericMatch[2];

            const stringMatch = redirectedUrl.match(/\/template-detail\/([a-zA-Z0-9-]+)/);
            if (stringMatch) return stringMatch[1];

            const url = new URL(redirectedUrl);
            const templateId = url.searchParams.get('template_id');
            if (templateId) return templateId;
        }
        return null;
    } catch {
        return null;
    }
}

async function getMeta(shortUrl) {
    const response = await axios.get(shortUrl, {
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        },
    });

    const $ = cheerio.load(response.data);
    let templateDataJson = null;

    $('script').each((i, el) => {
        const scriptText = $(el).html();
        if (scriptText.includes('window._ROUTER_DATA')) {
            templateDataJson = scriptText;
            return false;
        }
    });

    const metaJSON = JSON.parse(templateDataJson.replace('window._ROUTER_DATA = ', ''));
    const template = metaJSON?.loaderData['template-detail_$']?.templateDetail;
    if (!template) throw new Error('Video URL tidak ditemukan');

    return {
        title: template.title,
        desc: template.desc,
        like: template.likeAmount,
        play: template.playAmount,
        duration: template.templateDuration,
        usage: template.usageAmount,
        createTime: template.createTime,
        coverUrl: template.coverUrl,
        videoRatio: template.videoRatio,
        author: template.author,
    };
}

async function capcutDownloader(capcutUrl, meta = true) {
    try {
        if (!capcutUrl) return errorResponse('Video URL not found');

        const templateId = await getTemplateId(capcutUrl);
        const response = await axios.get(`https://www.capcut.com/id-id/templates/${templateId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            },
        });

        const $ = cheerio.load(response.data);
        let videoData = null;

        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                videoData = JSON.parse($(el).html());
                return false;
            } catch (e) {}
        });

        if (videoData) {
            if (meta) {
                videoData = { ...videoData, meta: await getMeta(capcutUrl) };
            }
            return successResponse(videoData);
        }

        return errorResponse('Data VideoObject not found in LD+JSON');
    } catch (error) {
        return errorResponse(error.message || 'Something went wrong');
    }
}

module.exports = capcutDownloader;
