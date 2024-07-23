const fs = require('fs');
const fsPromises = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('@distube/ytdl-core');
const path = require('path');

const QUALITY_MAP = {
    1: '160',   // 144p
    2: '134',   // 360p
    3: '135',   // 480p
    4: ['302', '136', '247'],  // 720p
    5: ['303', '248'],         // 1080p
    6: ['308', '271'],         // 1440p
    7: ['315', '313'],         // 2160p
    8: 'highestaudio',
    9: 'bitrateList'
};

async function youtubeDownloader(link, qualityIndex) {
    try {
        const quality = QUALITY_MAP[qualityIndex] || QUALITY_MAP[2];
        const info = await ytdl.getInfo(link);

        if (quality === 'bitrateList') {
            return getBitrateList(info);
        }

        const videoDetails = info.videoDetails;
        const thumb = info.player_response.microformat.playerMicroformatRenderer.thumbnail.thumbnails[0].url;

        const format = await chooseFormat(info, quality);
        if (!format && qualityIndex <= 7) {
            throw new Error(`No video found with quality '${getQualityLabel(qualityIndex)}'P.`);
        }

        const tempDir = await createTempDirectory();

        if (qualityIndex > 7 || quality === 'highestaudio') {
            return await downloadAudioOnly(info, quality, videoDetails, thumb, tempDir);
        } else {
            return await downloadVideoWithAudio(info, quality, videoDetails, thumb, tempDir);
        }
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
        .filter(element => !element.hasVideo && element.hasAudio)
        .map(element => ({
            codec: element.codecs,
            bitrate: element.audioBitrate,
            itag: element.itag
        }))
        .sort((a, b) => b.bitrate - a.bitrate);

    return {
        creator: '@ShiroNexo',
        status: true,
        data: { bitrateList }
    };
}

async function chooseFormat(info, quality) {
    if (Array.isArray(quality)) {
        for (const q of quality) {
            try {
                const format = await ytdl.chooseFormat(info.formats, { quality: q });
                if (format) return format;
            } catch (e) {
                // Continue to next quality option
            }
        }
    }
    return await ytdl.chooseFormat(info.formats, { quality });
}

async function createTempDirectory() {
    const tempDir = path.join(process.cwd(), 'temp');
    await fsPromises.mkdir(tempDir, { recursive: true });
    return tempDir;
}

async function downloadAudioOnly(info, quality, videoDetails, thumb, tempDir) {
    const audioStream = ytdl.downloadFromInfo(info, { quality });
    const tempMp3 = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);

    console.log('Downloading audio...');
    await streamToFile(audioStream, tempMp3);
    console.log('Audio download complete.');

    const mp3Buffer = await fsPromises.readFile(tempMp3);
    await fsPromises.unlink(tempMp3);

    return createResponse(videoDetails, mp3Buffer, quality, thumb);
}

async function downloadVideoWithAudio(info, quality, videoDetails, thumb, tempDir) {
    const videoStream = ytdl.downloadFromInfo(info, { quality });
    const audioStream = ytdl.downloadFromInfo(info, { quality: 'highestaudio' });

    const mp4File = path.join(tempDir, `buff_${Date.now()}.mp4`);
    const tempMp4 = path.join(tempDir, `temp_video_${Date.now()}.mp4`);
    const tempMp3 = path.join(tempDir, `temp_audio_${Date.now()}.mp4`);

    console.log('Downloading audio and video...');
    await Promise.all([
        streamToFile(audioStream, tempMp3),
        streamToFile(videoStream, tempMp4)
    ]);
    console.log('Audio and video download complete.');

    console.log('Merging audio and video...');
    await mergeAudioVideo(tempMp3, tempMp4, mp4File);
    console.log('Merge complete.');

    const mp4Buffer = await fsPromises.readFile(mp4File);
    await Promise.all([
        fsPromises.unlink(tempMp3),
        fsPromises.unlink(tempMp4),
        fsPromises.unlink(mp4File)
    ]);

    return createResponse(videoDetails, mp4Buffer, quality, thumb);
}

function streamToFile(stream, filePath) {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        stream.on('end', resolve);
        stream.on('error', reject);
        writeStream.on('error', reject);
    });
}

function mergeAudioVideo(audioPath, videoPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(audioPath)
            .input(videoPath)
            .outputOptions('-c:v copy')
            .outputOptions('-c:a aac')
            .outputOptions('-strict experimental')
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

function createResponse(videoDetails, buffer, quality, thumb) {
    return {
        creator: '@ShiroNexo',
        status: true,
        data: {
            title: videoDetails.title,
            result: buffer,
            size: buffer.length,
            quality,
            desc: videoDetails.description,
            views: videoDetails.viewCount,
            likes: videoDetails.likes,
            dislikes: videoDetails.dislikes,
            channel: videoDetails.ownerChannelName,
            uploadDate: videoDetails.uploadDate,
            thumb,
        },
    };
}

function getQualityLabel(qualityIndex) {
    return ['144', '360', '480', '720', '1080', '1440', '2160'][qualityIndex - 1];
}

module.exports = youtubeDownloader;