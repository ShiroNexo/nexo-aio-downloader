const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { join } = require('path');
const ffmpeg = require('fluent-ffmpeg');
const os = require('os');

const tempDir = os.tmpdir();

async function bilibiliDownloader(url, quality = '480P') {
    try {
        let aid = /\/video\/(\d+)/.exec(url)[1];

        const appInfo = await axios.get(url).then(res => res.data)

        const $ = cheerio.load(appInfo);
        const title = $('meta[property="og:title"]').attr('content').split('|')[0].trim();
        const locate = $('meta[property="og:locale"]').attr('content');
        const description = $('meta[property="og:description"]').attr('content');
        const type = $('meta[property="og:video:type"]').attr('content');
        const cover = $('meta[property="og:image"]').attr('content');
        const like = $('.interactive__btn.interactive__like .interactive__text').text();
        const views = $('.bstar-meta__tips-left .bstar-meta-text').first().text();

        const response = await axios.get('https://api.bilibili.tv/intl/gateway/web/playurl', {
            params: {
                's_locale': 'id_ID',
                'platform': 'web',
                'aid': aid,
                'qn': '64',
                'type': '0',
                'device': 'wap',
                'tf': '0',
                'spm_id': 'bstar-web.ugc-video-detail.0.0',
                'from_spm_id': 'bstar-web.homepage.trending.all',
                'fnval': '16',
                'fnver': '0',
                'fnver': '0',
                'fnval': '16',
            }
        }).then(res => res.data)

        const videoList = response.data.playurl.video.map(item => {
            return {
                quality: item.stream_info.desc_words,
                codecs: item.video_resource.codecs,
                size: item.video_resource.size,
                mime: item.video_resource.mime_type,
                url: item.video_resource.url || item.video_resource.backup_url[0]
            }
        })

        const audioList = response.data.playurl.audio_resource.map(item => {
            return {
                size: item.size,
                url: item.url || item.backup_url[0]
            }
        })
        const v = videoList.filter(v => v.quality == quality)[0];
        if (!v) {
            throw new Error('No video found');
        }

        const [videoBuffer, audioBuffer] = await Promise.all([
            getVideo(url, v.url),
            getVideo(url, audioList[0].url)
        ]);

        const buffer = await mergeAudioVideo(audioBuffer, videoBuffer);

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                title,
                locate,
                description,
                type,
                cover,
                views,
                like,
                result: buffer,
                mediaList: {
                    videoList,
                    audioList,
                }
            }
        }
    } catch (error) {
        console.error('Bilibili Error: ', error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'Something went wrong'
        }
    }
}

function mergeAudioVideo(audioBuffer, videoBuffer) {
    return new Promise((resolve, reject) => {
        const audioPath = join(tempDir, `${Date.now()}-audio.mp3`);
        const videoPath = join(tempDir, `${Date.now()}-video.mp4`);
        const outputPath = join(tempDir, `${Date.now()}-output.mp4`);
        
        fs.writeFileSync(audioPath, audioBuffer);
        fs.writeFileSync(videoPath, videoBuffer);
        
        ffmpeg()
            .input(audioPath)
            .input(videoPath)
            .outputOptions('-c:v copy')
            .outputOptions('-c:a aac')
            .outputOptions('-strict experimental')
            .on('error', (err) => {
                fs.unlinkSync(audioPath);
                fs.unlinkSync(videoPath);
                reject(err);
            })
            .on('end', () => {
                const outputBuffer = fs.readFileSync(outputPath);
                fs.unlinkSync(audioPath);
                fs.unlinkSync(videoPath);
                fs.unlinkSync(outputPath);
                resolve(outputBuffer);
            })
            .save(outputPath);
    });
}

async function getVideo(refer, url) {
    const headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Dnt': '1',
        'Origin': 'https://www.bilibili.tv',
        'Pragma': 'no-cache',
        'Priority': 'u=1, i',
        'Referer': refer,
        'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': 'Windows',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'
    };

    try {
        let buffers = [];
        let start = 0;
        let end = 5 * 1024 * 1024; // 5MB chunks
        let fileSize = 0;

        while (true) {
            const range = `bytes=${start}-${end}`;

            const response = await axios.get(url, {
                headers: { ...headers, Range: range },
                responseType: 'arraybuffer'
            });

            if (fileSize === 0) {
                const contentRange = response.headers['content-range'];
                if (contentRange) {
                    fileSize = parseInt(contentRange.split('/')[1]);
                    console.log(`Total file size: ${fileSize} bytes`);
                }
            }

            buffers.push(Buffer.from(response.data));

            if (end >= fileSize - 1) {
                break;
            }

            start = end + 1;
            end = Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1);
        }

        const finalBuffer = Buffer.concat(buffers);
        console.log('Media has been downloaded to buffer');
        return finalBuffer;
    } catch (error) {
        throw error;
    }
}

module.exports = bilibiliDownloader