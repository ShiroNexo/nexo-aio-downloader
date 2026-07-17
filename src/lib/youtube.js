const fs = require('fs');
const fsPromises = require('fs').promises;
const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const axios = require('axios');
const ffmpegStatic = require('ffmpeg-static');
const { successResponse, errorResponse, sanitizeTitle } = require('./utils');

const ffmpegPath = fs.existsSync(ffmpegStatic) ? ffmpegStatic : 'ffmpeg';
const tempDir = os.tmpdir();

let youtubedl;
try {
    const bundledYtDlp = path.join(__dirname, '..', '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
    if (!fs.existsSync(bundledYtDlp)) {
        try {
            const sysPath = execSync('where yt-dlp', { stdio: 'pipe' }).toString().trim().split(/[\r\n]+/)[0];
            if (sysPath && fs.existsSync(sysPath)) {
                process.env.YOUTUBE_DL_DIR = path.dirname(sysPath);
            }
        } catch (e) {}
    }
    youtubedl = require('youtube-dl-exec');
} catch (err) {
    console.log('youtube-dl-exec not found. YouTube download feature is disabled.');
}

const QUALITY_MAP = {
    1: '160',
    2: '134',
    3: '135',
    4: '136',
    5: '137',
    6: '264',
    7: '266',
    8: 'bestaudio',
    9: 'bitrateList',
};

async function youtubeDownloader(link, qualityIndex) {
    if (!youtubedl) {
        return errorResponse("youtube-dl-exec not found, can't download video");
    }

    try {
        const quality = QUALITY_MAP[qualityIndex] || QUALITY_MAP[2];

        const info = await youtubedl(link, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        });

        const tempInfoFile = path.join(tempDir, `info_${Date.now()}.json`);
        await fsPromises.writeFile(tempInfoFile, JSON.stringify(info));

        let result;
        if (quality === 'bitrateList') {
            result = getBitrateList(info);
        } else if (qualityIndex > 7 || quality === 'bestaudio') {
            result = await downloadAudioOnly(tempInfoFile, quality, info);
        } else {
            result = await downloadVideoWithAudio(tempInfoFile, quality, info);
        }

        await fsPromises.unlink(tempInfoFile).catch(() => {});
        return result;

    } catch (err) {
        console.error('Youtube Downloader Error:\n', err);
        return errorResponse(err.message);
    }
}

function getBitrateList(info) {
    const bitrateList = info.formats
        .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
        .map(f => ({ codec: f.acodec, bitrate: f.abr, format_id: f.format_id }))
        .sort((a, b) => b.bitrate - a.bitrate);

    return successResponse({ bitrateList });
}

async function downloadAudioOnly(infoFile, quality, info) {
    const tempMp3 = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);

    console.log('Downloading audio...');
    await youtubedl.exec('', {
        loadInfoJson: infoFile,
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0',
        output: tempMp3,
    });

    const mp3Buffer = await fsPromises.readFile(tempMp3);
    await fsPromises.unlink(tempMp3).catch(() => {});
    console.log('Audio download complete.');

    return buildDownloadResponse(info, mp3Buffer, quality, 'mp3');
}

async function downloadVideoWithAudio(infoFile, quality, info) {
    const baseName = `temp_video_${Date.now()}`;
    const videoOutput = path.join(tempDir, `${baseName}.fvideo.mp4`);
    const audioOutput = path.join(tempDir, `${baseName}.faudio.m4a`);
    const finalOutput = path.join(tempDir, `${baseName}.mp4`);

    try {
        console.log('Downloading video...');
        await youtubedl.exec('', { loadInfoJson: infoFile, format: quality, output: videoOutput });

        console.log('Downloading audio...');
        await youtubedl.exec('', { loadInfoJson: infoFile, format: 'bestaudio', output: audioOutput });

        console.log('Merging video & audio...');
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-i', videoOutput, '-i', audioOutput,
                '-c:v', 'copy', '-c:a', 'aac',
                '-strict', 'experimental', finalOutput,
            ]);
            ffmpeg.on('close', code => {
                code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`));
            });
        });
        console.log('Merge complete.');

        const mp4Buffer = await fsPromises.readFile(finalOutput);
        await Promise.all([videoOutput, audioOutput, finalOutput].map(f => fsPromises.unlink(f).catch(() => {})));

        return buildDownloadResponse(info, mp4Buffer, quality, 'mp4');

    } catch (err) {
        console.error('Error in downloading or merging video and audio:', err);
        throw err;
    }
}

function buildDownloadResponse(info, buffer, quality, type) {
    return successResponse({
        title: info.title,
        result: buffer,
        size: buffer.length,
        quality,
        desc: info.description,
        views: info.view_count,
        likes: info.like_count,
        dislikes: 0,
        channel: info.uploader,
        uploadDate: info.upload_date,
        thumb: info.thumbnail,
        type,
    });
}

function extractPlaylistId(url) {
    try {
        const start = url.indexOf('list=');
        if (start === -1) return null;
        const end = url.indexOf('&', start);
        return url.substring(start + 5, end === -1 ? url.length : end);
    } catch {
        return null;
    }
}

async function youtubePlaylistDownloader(url, quality, folderPath) {
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
        return errorResponse("Can't extract Playlist ID from URL.");
    }
    console.log('Playlist ID:', playlistId);

    const outputDir = folderPath || path.join(process.cwd(), 'temp');

    try {
        const { data: html } = await axios.get(url);

        const arr = html.split('"watchEndpoint":{"videoId":"');
        const db = {};
        for (let i = 1; i < arr.length; i++) {
            const str = arr[i];
            const ei = str.indexOf('"');
            if (str.substring(ei, ei + 13) !== '","playlistId') continue;
            db[str.substring(0, ei)] = 1;
        }

        const videoIds = Object.keys(db);
        console.log(`Found ${videoIds.length} videos in playlist`);

        const title = html.match(/property="og:title" content="(.+?)"/)?.[1] || 'Unknown';

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const resultPath = [];
        const metadata = [];

        for (const vid of videoIds) {
            try {
                const res = await youtubeDownloader(vid, quality);
                if (res.status) {
                    const filePath = path.join(outputDir, `${sanitizeTitle(res.data.title)}.${res.data.type}`);
                    fs.writeFileSync(filePath, res.data.result);
                    resultPath.push(filePath);
                    metadata.push(res.data);
                    console.log(`Saved: ${filePath}`);
                }
            } catch (e) {
                console.error(`Failed to download video ${vid}:`, e.message);
            }
        }

        return successResponse({ title, resultPath, metadata });

    } catch (e) {
        console.error('Youtube Playlist Error:', e);
        return errorResponse(e.message || 'Something went wrong.');
    }
}

module.exports = { youtubeDownloader, youtubePlaylistDownloader };
