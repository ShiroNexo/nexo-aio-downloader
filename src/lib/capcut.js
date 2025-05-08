const axios = require('axios');
const cheerio = require('cheerio');

async function getTemplateId(templateUrl) {
    try {
        let id = null;

        const directIdMatch = templateUrl.match(/\/template-detail\/(?:[a-zA-Z0-9-]+)?\/(\d+)|\/templates\/(\d+)/);

        if (directIdMatch) {
            id = directIdMatch[1] || directIdMatch[2] || directIdMatch[3];
            return id;
        }

        const response = await axios.get(templateUrl, {
            maxRedirects: 5,
            validateStatus: status => status >= 200 && status < 400,
        });

        const redirectedUrl = response.request.res.responseUrl;

        if (redirectedUrl) {
            const numericIdMatch = redirectedUrl.match(/\/template-detail\/(?:[a-zA-Z0-9-]+)?\/(\d+)|\/templates\/(?:[a-zA-Z0-9-]+-)?(\d+)/);
            if (numericIdMatch) {
                const id = numericIdMatch[1] || numericIdMatch[2];
                return id;
            }
            const stringIdMatch = redirectedUrl.match(/\/template-detail\/([a-zA-Z0-9-]+)/);
            if (stringIdMatch) {
                return stringIdMatch[1];
            }
            const templateId = url.searchParams.get('template_id');
            if (templateId) {
                return templateId;
            }
        }

        if (id) {
            return id;
        } else {
            return null;
        }

    } catch (error) {
        return null;
    }
}

async function getMeta(shortUrl) {
    try {
        const response = await axios.get(shortUrl, {
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let templateDataJson = null;
        $('script').each((i, el) => {
            const scriptText = $(el).html();
            console.log('scriptText:', scriptText);
            if (scriptText.includes('window._ROUTER_DATA')) {
                templateDataJson = scriptText;
                return false;
            }
        });
        const metaJSON = JSON.parse(templateDataJson.replace('window._ROUTER_DATA = ', ''));

        if (metaJSON?.loaderData['template-detail_$']?.templateDetail) {
            let template = metaJSON.loaderData['template-detail_$'].templateDetail

            let result = {
                title: template.title,
                desc: template.desc,
                like: template.likeAmount,
                play: template.playAmount,
                duration: template.templateDuration,
                usage: template.usageAmount,
                createTime: template.createTime,
                coverUrl: template.coverUrl,
                videoRatio: template.videoRatio,
                author: template.author
            }

            return result;
        } else {
            throw new Error('Video URL tidak ditemukan');
        }

    } catch (error) {
        throw error;
    }
}

async function capcutDownloader(capcutUrl, meta = true) {
    try {
        if (!capcutUrl) {
            return {
                creator: '@ShiroNexo',
                status: false,
                message: 'Video URL not found'
            }
        }
        const templateId = await getTemplateId(capcutUrl)

        const response = await axios.get(`https://www.capcut.com/id-id/templates/${templateId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let videoData = null;

        $('script[type="application/ld+json"]').each((i, el) => {
            const scriptText = $(el).html();
            try {
                videoData = JSON.parse(scriptText);
                return false;
            } catch (e) {
                console.error("Error parsing JSON:", e);
            }
        });

        if (videoData) {
            if (meta) {
                videoData = { ...videoData, ...await getMeta(capcutUrl) };
            }
            return {
                creator: '@ShiroNexo',
                status: true,
                data: videoData
            }
        } else {
            return {
                creator: '@ShiroNexo',
                status: false,
                message: 'Data VideoObject not found in LD+JSON'
            }
        }

    } catch (error) {
        console.error("Error:", error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'Something went wrong'
        }
    }
}

module.exports = capcutDownloader