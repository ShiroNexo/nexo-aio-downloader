const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

async function tiktokDownloader(url) {
    const jar = new CookieJar();

    const apiClient = axios.create({
        jar: jar,
        withCredentials: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0'
        }
    });
    wrapper(apiClient);

    try {
        const htmlResponse = await apiClient.get(url);
        const html = htmlResponse.data;

        const $ = cheerio.load(html);
        const scriptContent = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
        if (!scriptContent) throw new Error('Script tag #__UNIVERSAL_DATA_FOR_REHYDRATION__ not found.');
        const jsonData = JSON.parse(scriptContent);
        const itemStruct = jsonData?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;
        if (!itemStruct) throw new Error('itemStruct not found within the JSON data.');

        const videoUrlToDownload = itemStruct.video?.downloadAddr || itemStruct.video?.playAddr;
        const videoId = itemStruct.id;

        const importantData = {
            videoId: videoId,
            description: itemStruct.desc,
            createTime: itemStruct.createTime,
            videoUrl: videoUrlToDownload,
            videoInfo: {
                size: null,
                duration: itemStruct.video?.duration,
                width: itemStruct.video?.width,
                height: itemStruct.video?.height,
                definition: itemStruct.video?.definition,
                coverUrl: itemStruct.video?.cover,
                subtitles: itemStruct.video?.subtitleInfos?.map(sub => ({
                    language: sub.LanguageCodeName, url: sub.Url, format: sub.Format, source: sub.Source
                })) || []
            },
            author: {
                id: itemStruct.author?.id,
                uniqueId: itemStruct.author?.uniqueId,
                nickname: itemStruct.author?.nickname,
                avatarThumb: itemStruct.author?.avatarThumb
            },
            music: {
                id: itemStruct.music?.id,
                title: itemStruct.music?.title,
                authorName: itemStruct.music?.authorName,
                playUrl: itemStruct.music?.playUrl, isOriginal: itemStruct.music?.original
            },
            stats: {
                likes: itemStruct.statsV2?.diggCount ?? itemStruct.stats?.diggCount,
                shares: itemStruct.statsV2?.shareCount ?? itemStruct.stats?.shareCount,
                comments: itemStruct.statsV2?.commentCount ?? itemStruct.stats?.commentCount,
                plays: itemStruct.statsV2?.playCount ?? itemStruct.stats?.playCount,
                collects: itemStruct.statsV2?.collectCount ?? itemStruct.stats?.collectCount,
                reposts: itemStruct.statsV2?.repostCount
            },
            locationCreated: itemStruct.locationCreated,
            videoBuffer: null
        };

        if (videoUrlToDownload) {
            try {
                const videoResponse = await apiClient.get(videoUrlToDownload, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Referer': url,
                        'Range': 'bytes=0-'
                    }
                });

                if (videoResponse.status === 200 || videoResponse.status === 206) {
                    importantData.videoBuffer = Buffer.from(videoResponse.data);
                    importantData.videoInfo.size = videoResponse.data.length;
                } else {
                    console.warn(`Failed to download video. Status: ${videoResponse.status}`);
                }
            } catch (videoError) {
                console.error(`Error downloading video: ${videoError.message}`);
                if (videoError.response) {
                    console.error(`Video Download Status Code: ${videoError.response.status}`);
                }
            }
        } else {
            console.warn("Video download URL not found in the data.");
        }

        return {
            creator: '@ShiroNexo',
            status: true,
            data: importantData
        };

    } catch (error) {
        console.error('Error during main process:', error.message);
        return {
            creator: '@ShiroNexo',
            status: false,
            data: null
        };
    }
}


module.exports = tiktokDownloader