const fs = require('fs');
const fsPromises = require('fs').promises;
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const os = require('os');
const { join } = require('path');
let youtubedl;

try {
    youtubedl = require('youtube-dl-exec');
} catch (err) {
    console.log('youtube-dl-exec not found. YouTube download feature is disabled.');
}

const tempDir = os.tmpdir();

const QUALITY_MAP = {
    1: '160',   // 144p
    2: '134',   // 360p
    3: '135',   // 480p
    4: '136',   // 720p
    5: '137',   // 1080p
    6: '264',   // 1440p
    7: '266',   // 2160p
    8: 'bestaudio',
    9: 'bitrateList'
};

async function youtubeDownloader(link, qualityIndex) {
    if (!youtubedl) {
        return {
            status: false,
            message: `youtube-dl-exec not found, can't download video`,
        };
    }
    try {
        let quality = QUALITY_MAP[qualityIndex] || QUALITY_MAP[2];

        const info = await youtubedl(link, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        const videoDetails = info;
        const thumb = info.thumbnail;

        const tempInfoFile = path.join(tempDir, `info_${Date.now()}.json`);
        await fsPromises.writeFile(tempInfoFile, JSON.stringify(info));

        let result;
        if (quality === 'bitrateList') {
            result = getBitrateList(info);
        } else if (qualityIndex > 7 || quality === 'bestaudio') {
            result = await downloadAudioOnly(tempInfoFile, quality, videoDetails, thumb);
        } else {
            result = await downloadVideoWithAudio(tempInfoFile, quality, videoDetails, thumb);
        }

        await fsPromises.unlink(tempInfoFile);

        return result;

    } catch (err) {
        console.error('Youtube Downloader Error:\n', err);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: err.message,
        };
    }
}

function getBitrateList(info) {
    const bitrateList = info.formats
        .filter(element => element.acodec !== 'none' && element.vcodec === 'none')
        .map(element => ({
            codec: element.acodec,
            bitrate: element.abr,
            format_id: element.format_id
        }))
        .sort((a, b) => b.bitrate - a.bitrate);

    return {
        creator: '@ShiroNexo',
        status: true,
        data: { bitrateList }
    };
}

async function downloadAudioOnly(infoFile, quality, videoDetails, thumb) {
    const tempMp3 = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);

    console.log('Downloading audio...');
    await youtubedl.exec('', {
        loadInfoJson: infoFile,
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0',
        output: tempMp3
    });
    console.log('Audio download complete.');

    const mp3Buffer = await fsPromises.readFile(tempMp3);
    await fsPromises.unlink(tempMp3);

    return createResponse(videoDetails, mp3Buffer, quality, thumb, 'mp3');
}

async function downloadVideoWithAudio(infoFile, quality, videoDetails, thumb) {
    const baseName = `temp_video_${Date.now()}`;
    const videoOutput = path.join(tempDir, `${baseName}.fvideo.mp4`);
    const audioOutput = path.join(tempDir, `${baseName}.faudio.m4a`);
    const finalOutput = path.join(tempDir, `${baseName}.mp4`);

    try {
        console.log('Downloading video...');
        await youtubedl.exec('', {
            loadInfoJson: infoFile,
            format: quality,
            output: videoOutput
        });

        console.log('Downloading audio...');
        await youtubedl.exec('', {
            loadInfoJson: infoFile,
            format: 'bestaudio',
            output: audioOutput
        });

        console.log('Merging video & audio...');
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-i', videoOutput,
                '-i', audioOutput,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-strict', 'experimental',
                finalOutput
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('Merge complete.');
                    resolve();
                } else {
                    reject(new Error(`ffmpeg exited with code ${code}`));
                }
            });
        });

        const mp4Buffer = await fsPromises.readFile(finalOutput);

        await fsPromises.unlink(videoOutput);
        await fsPromises.unlink(audioOutput);
        await fsPromises.unlink(finalOutput);

        return createResponse(videoDetails, mp4Buffer, quality, thumb, 'mp4');

    } catch (err) {
        console.error('Error in downloading or merging video and audio:', err);
        throw err;
    }
}


function createResponse(videoDetails, buffer, quality, thumb, type) {
    return {
        creator: '@ShiroNexo',
        status: true,
        data: {
            title: videoDetails.title,
            result: buffer,
            size: buffer.length,
            quality,
            desc: videoDetails.description,
            views: videoDetails.view_count,
            likes: videoDetails.like_count,
            dislikes: 0,
            channel: videoDetails.uploader,
            uploadDate: videoDetails.upload_date,
            thumb,
            type
        },
    };
}

function sanitizeTitle(title) {
    return title
        .replace(/[\/\\:*?"<>|]/g, '_')
        .trim();
}


async function youtubePlaylistDownloader(url, quality, folderPath = join(process.cwd() + '/temp')) {
    try {
        playlistId = url.slice(url.indexOf("list="), url.indexOf("&index"))
        console.log("Playlist ID: " + playlistId);
    } catch {
        console.log("can't extract Playlist ID from URL. Check URL or Code (search for 'playlistId =')")
        return {
            creator: '@ShiroNexo',
            status: false,
            message: e.message || 'Invalid Playlist URL'
        }
    }
    try {
        const { data } = await axios.get(url);
        const htmlStr = data
        fs.writeFileSync('./keys.txt', htmlStr)

        let arr = htmlStr.split('"watchEndpoint":{"videoId":"')
        var db = {}

        for (var i = 1; i < arr.length; i++) {
            let str = arr[i]
            let eI = str.indexOf('"')
            if (str.slice(eI, eI + 13) != '","playlistId') continue
            let sstr = str.slice(0, eI)
            db[sstr] = 1
        }
        console.log(Object.keys(db))
        console.log(Object.keys(db).length)
        let title = htmlStr.match(/property="og:title" content="(.+?)"/)?.[1]

        let resultPath = []
        let metadata = []

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            console.log(`Folder ${folderPath} berhasil dibuat.`);
        }
        Object.keys(db).forEach(async key => {
            const info = await ytdl.getInfo(link);
            const videoTitle = info.videoDetails.title;
            const testPath = join(folderPath, `${sanitizeTitle(videoTitle)}.`);

            if (fs.existsSync(testPath + '.mp4') || fs.existsSync(testPath + '.mp3')) {
                console.log(`File ${videoTitle} already exists. Skipping...`);
                return;
            }
            await youtubeDownloader(key, quality)
                .then(res => {
                    const filePath = join(folderPath, `${sanitizeTitle(res.data.title)}.${res.data.type}`)
                    fs.writeFileSync(filePath, res.data.result)
                    resultPath.push(filePath)
                    metadata.push(res.data)
                    console.log(`File ${videoTitle} saved to ${folderPath}`)
                })
        })

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                title,
                resultPath,
                metadata
            }
        }
    } catch (e) {
        console.log(e)
        return {
            creator: '@ShiroNexo',
            status: false,
            message: e.message || 'Something went wrong.'
        }
    }
}

module.exports = {
    youtubeDownloader,
    youtubePlaylistDownloader
}