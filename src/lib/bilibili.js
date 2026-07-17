const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const { successResponse, errorResponse } = require('./utils');

const ffmpegPath = fs.existsSync(ffmpegStatic) ? ffmpegStatic : 'ffmpeg';
const tempDir = os.tmpdir();

async function bilibiliDownloader(url, { download = false, quality = '32', cookie = '' } = {}) {
    try {
        const aid = /\/video\/(\d+)/.exec(url)?.[1];
        if (!aid) return errorResponse('Invalid Bilibili URL');

        const appInfo = await axios.get(url).then(res => res.data);
        const $ = cheerio.load(appInfo);

        const title = $('meta[property="og:title"]').attr('content')?.split('|')[0]?.trim() || '';
        const locate = $('meta[property="og:locale"]').attr('content');
        const description = $('meta[property="og:description"]').attr('content');
        const type = $('meta[property="og:video:type"]').attr('content');
        const cover = $('meta[property="og:image"]').attr('content');
        const like = $('.interactive__btn.interactive__like .interactive__text').text();
        const views = $('.bstar-meta__tips-left .bstar-meta-text').first().text();

        const response = await axios.get('https://api.bilibili.tv/intl/gateway/web/playurl', {
            headers: { cookie: cookie.startsWith('SESSDATA=') ? cookie : `SESSDATA=${cookie}` },
            params: {
                s_locale: 'id_ID',
                platform: 'web',
                aid,
                qn: '64',
                type: '0',
                device: 'wap',
                tf: '0',
                spm_id: 'bstar-web.ugc-video-detail.0.0',
                from_spm_id: 'bstar-web.homepage.trending.all',
                fnval: '16',
                fnver: '0',
            },
        }).then(res => res.data);

        const videoList = response.data.playurl.video.map(item => ({
            quality: item.stream_info.desc_words,
            quality_id: item.video_resource.quality,
            codecs: item.video_resource.codecs,
            size: item.video_resource.size,
            mime: item.video_resource.mime_type,
            url: item.video_resource?.url || item.video_resource?.backup_url?.[0],
        }));

        const audioList = response.data.playurl.audio_resource.map(item => ({
            size: item.size,
            url: item.url || item.backup_url[0],
        }));

        let buffer = null;
        if (download) {
            const v = videoList.find(v => v.quality_id == quality);
            if (!v) throw new Error('No video found for the specified quality.');

            const [videoBuffer, audioBuffer] = await Promise.all([
                getBuffer(url, v.url),
                getBuffer(url, audioList[0].url),
            ]);

            buffer = await mergeAudioVideo(audioBuffer, videoBuffer);
        }

        return successResponse({
            title,
            locate,
            description,
            type,
            cover,
            views,
            like,
            result: buffer,
            mediaList: { videoList, audioList },
        });
    } catch (error) {
        console.error('Bilibili Error:', error);
        return errorResponse(error.message || 'Something went wrong');
    }
}

function mergeAudioVideo(audioBuffer, videoBuffer) {
    return new Promise((resolve, reject) => {
        const audioPath = path.join(tempDir, `${Date.now()}-audio.mp3`);
        const videoPath = path.join(tempDir, `${Date.now()}-video.mp4`);
        const outputPath = path.join(tempDir, `${Date.now()}-output.mp4`);

        fs.writeFileSync(audioPath, audioBuffer);
        fs.writeFileSync(videoPath, videoBuffer);

        const ffmpeg = spawn(ffmpegPath, [
            '-i', videoPath, '-i', audioPath,
            '-c:v', 'copy', '-c:a', 'aac',
            '-strict', 'experimental', '-y', outputPath,
        ]);

        ffmpeg.on('error', err => { cleanup(); reject(err); });
        ffmpeg.on('close', code => {
            if (code === 0) {
                try {
                    const outputBuffer = fs.readFileSync(outputPath);
                    cleanup();
                    resolve(outputBuffer);
                } catch (err) { cleanup(); reject(err); }
            } else {
                cleanup();
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });

        function cleanup() {
            [audioPath, videoPath, outputPath].forEach(p => {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            });
        }
    });
}

async function getBuffer(refer, url) {
    const headers = {
        Accept: '*/*',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Dnt: '1',
        Origin: 'https://www.bilibili.tv',
        Pragma: 'no-cache',
        Priority: 'u=1, i',
        Referer: refer,
        'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': 'Windows',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
    };

    let buffers = [];
    let start = 0;
    let end = 5 * 1024 * 1024;
    let fileSize = 0;

    while (true) {
        const response = await axios.get(url, {
            headers: { ...headers, Range: `bytes=${start}-${end}` },
            responseType: 'arraybuffer',
        });

        if (fileSize === 0) {
            const contentRange = response.headers['content-range'];
            if (contentRange) fileSize = parseInt(contentRange.split('/')[1]);
        }

        buffers.push(Buffer.from(response.data));

        if (end >= fileSize - 1) break;

        start = end + 1;
        end = Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1);
    }

    return Buffer.concat(buffers);
}

module.exports = bilibiliDownloader;
