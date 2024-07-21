const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('@distube/ytdl-core');
const path = require('path');

async function youtubeDownloader(link, qualitys) {
    try {
        let quality = ['160', '134', '135', ['302','136','247'], ['303', '248'], ['308', '271'], ['315', '313'], 'mp3'][qualitys - 1] || '134'; // 134:360p || 135:480p || 136:720p || 248:1080p || 271:1440p || 313:2160p
        if (qualitys > 100) quality = qualitys;

        const info = await ytdl.getInfo(link);

        if (quality === 'mp3') {
            let bitrateList = [];
            info.formats.forEach(element => {
                if (!element.hasVideo && element.hasAudio) {
                    bitrateList.push({
                        codec: element.codecs,
                        bitrate: element.audioBitrate,
                        itag: element.itag
                    });
                }
            });

            return {
                owner: '@ShiroNexo',
                status: "list-MP3",
                data: {
                    bitrateList: bitrateList.sort((a, b) => b.bitrate - a.bitrate)
                }
            }
        }

        const videoDetails = info.videoDetails;
        const thumb = info.player_response.microformat.playerMicroformatRenderer.thumbnail.thumbnails[0].url;

        let format = null;

        if (Array.isArray(quality)) {
            for (const q of quality) {
                try {
                    format = await ytdl.chooseFormat(info.formats, { quality: q });
                    if (format) break; // Exit the loop if a format is found
                } catch (e) {
                    format = null;
                }
            }
        } else if (qualitys <= 7 || quality === '134') {
            format = await ytdl.chooseFormat(info.formats, { quality: quality });
        }

        if ((!format && qualitys <= 7) || (!format && quality === '134')) {
			const vidQuality = ['144', '360', '480', '720', '1080', '1440', '2160'];
            throw new Error(`No Video found with quality '${vidQuality[qualitys - 1]}'P.`);
        }

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        if (qualitys > 100) {
            const checkQuality = await ytdl.chooseFormat(info.formats, { quality: quality });
            if (!checkQuality) throw new Error(`No format found!`);
            const audioStream = ytdl.downloadFromInfo(info, { quality: 'highestaudio' });

            const tempMp3 = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);

            console.log('Downloading audio...');
            await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(tempMp3);
                audioStream.pipe(writeStream);
                audioStream.on('end', resolve);
                audioStream.on('error', reject);
            });
            console.log('Audio download complete.');

            const mp3Buffer = fs.readFileSync(tempMp3);
            fs.unlinkSync(tempMp3);

            return {
                creator: '@ShiroNexo',
                status: true,
                data: {
                    title: videoDetails.title,
                    result: mp3Buffer,
                    size: mp3Buffer.length,
                    quality: quality,
                    desc: videoDetails.description,
                    views: videoDetails.viewCount,
                    likes: videoDetails.likes,
                    dislikes: videoDetails.dislikes,
                    channel: videoDetails.ownerChannelName,
                    uploadDate: videoDetails.uploadDate,
                    thumb,
                },
            };
        } else {
            const videoStream = ytdl.downloadFromInfo(info, { quality: quality });
            const audioStream = ytdl.downloadFromInfo(info, { quality: 'highestaudio' });

            const mp4File = path.join(tempDir, `buff_${Date.now()}.mp4`);
            const tempMp4 = path.join(tempDir, `temp_video_${Date.now()}.mp4`);
            const tempMp3 = path.join(tempDir, `temp_audio_${Date.now()}.mp4`);

            console.log('Downloading audio and video...');
            await Promise.all([
                new Promise((resolve, reject) => {
                    const writeStream = fs.createWriteStream(tempMp3);
                    audioStream.pipe(writeStream);
                    audioStream.on('end', resolve);
                    audioStream.on('error', reject);
                }),
                new Promise((resolve, reject) => {
                    const writeStream = fs.createWriteStream(tempMp4);
                    videoStream.pipe(writeStream);
                    videoStream.on('end', resolve);
                    videoStream.on('error', reject);
                }),
            ]);
            console.log('Audio and video download complete.');

            console.log('Merging audio and video...');
            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(tempMp3)
                    .input(tempMp4)
                    .outputOptions('-c:v copy')
                    .outputOptions('-c:a aac')
                    .outputOptions('-strict experimental')
                    .on('end', () => {
                        console.log('Merge complete.');
                        fs.unlinkSync(tempMp3);
                        fs.unlinkSync(tempMp4);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('Error during merge:', err);
                        reject(err);
                    })
                    .save(mp4File);
            });

            const mp4Buffer = fs.readFileSync(mp4File);
            fs.unlinkSync(mp4File);

            return {
                creator: '@ShiroNexo',
                status: true,
                data: {
                    title: videoDetails.title,
                    result: mp4Buffer,
                    size: mp4Buffer.length,
                    quality: quality,
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
    } catch (err) {
        console.error('Youtube Downloader Error:\n', err);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: err.message,
        };
    }
}

module.exports = youtubeDownloader;