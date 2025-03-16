const axios = require('axios');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const os = require('os');
const GIFEncoder = require('gifencoder');
const sharp = require('sharp');
const { PassThrough } = require('stream');

const tempDir = os.tmpdir();

const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'DNT': '1'
};

function getDownloadHeaders() {
    return {
        ...defaultHeaders,
        'Accept': '*/*',
        'Referer': 'https://www.pixiv.net/',
        'Origin': 'https://www.pixiv.net'
    };
}

function getMetadataHeaders(id, cookie) {
    return {
        ...defaultHeaders,
        'Accept': 'application/json',
        'Cookie': `PHPSESSID=${cookie}`,
        'Referer': `https://www.pixiv.net/en/artworks/${id}`
    };
}

function getImageHeaders() {
    return {
        ...defaultHeaders,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.pixiv.net/'
    };
}

function getMetaHeaders(cookie) {
    return {
        ...defaultHeaders,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cookie': `PHPSESSID=${cookie}`,
        'Referer': 'https://www.pixiv.net/'
    };
}

async function downloadFile(url, destination) {
    const writer = fs.createWriteStream(destination);
    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            headers: getDownloadHeaders()
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Failed to download file: ${error.message}`);
    }
}

async function extractZip(zipPath, extractToPath) {
    return fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractToPath }))
        .promise();
}

async function getMetadata(id, cookie) {
    const url = `https://www.pixiv.net/ajax/illust/${id}/ugoira_meta?lang=en`;
    try {
        const response = await axios.get(url, { headers: getMetadataHeaders(id, cookie) });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error(`R-18 works cannot be displayed. Cookie required to download R-18 works.`);
        }
        throw new Error(`Error fetching metadata`);
    }
}

function parseArtworkId(url) {
    const id = url.split('/').pop();
    if (!/^\d+$/.test(id)) throw new Error("Invalid Pixiv Url");
    return id;
}

function parseUserId(url) {
    if (/^\d+$/.test(url)) return url;
    const match = url.match(/\/users\/(\d+)/);
    return match ? match[1] : null;
}

async function createGIF(imageDir, frames) {
    console.log('Creating GIF...');
    const startTime = Date.now();
    const firstImagePath = path.join(imageDir, frames[0].file);
    const { width, height } = await sharp(firstImagePath).metadata();

    const encoder = new GIFEncoder(width, height);
    const stream = new PassThrough();
    const chunks = [];
    encoder.createReadStream().pipe(stream);
    stream.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
        stream.on('end', () => {
            console.log(`GIF created in ${((Date.now() - startTime) / 1000).toFixed(2)} Second!`);
            resolve(Buffer.concat(chunks));
        });
        stream.on('error', reject);

        encoder.start();
        encoder.setQuality(10);
        encoder.setRepeat(0);

        (async () => {
            try {
                for (const frame of frames) {
                    encoder.setDelay(frame.delay);
                    const imagePath = path.join(imageDir, frame.file);
                    const { data } = await sharp(imagePath)
                        .ensureAlpha()
                        .raw()
                        .toBuffer({ resolveWithObject: true });
                    encoder.addFrame(data);
                }
                encoder.finish();
            } catch (err) {
                reject(err);
            }
        })();
    });
}

async function pixivVideoDownloader(url, cookie) {
    const destination = path.join(tempDir, `${Date.now()}.zip`);
    const unzipPath = path.join(tempDir, `${Date.now()}`);

    try {
        const id = parseArtworkId(url);
        const data = await getMetadata(id, cookie);
        if (!data) return null;

        await downloadFile(data.body.originalSrc, destination);
        await extractZip(destination, unzipPath);

        const videoBuffer = await createGIF(unzipPath, data.body.frames);
        await cleanup(destination, unzipPath);

        return { type: 'gif', totalFrame: data.body.frames.length, buffer: videoBuffer };
    } catch (error) {
        await cleanup(destination, unzipPath);
        throw error;
    }
}

async function pixivImageDownloader(url) {
    try {
        console.log(`Downloading image from ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer', headers: getImageHeaders() });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to download image: ${error.message}`);
    }
}

async function pixivDownloader(input, cookie) {
    const id = parseArtworkId(input);
    const url = `https://www.pixiv.net/en/artworks/${id}`;
    try {
        const response = await axios.get(url, { headers: getMetaHeaders(cookie) });
        const preloadDataMatch = response.data.match(/<meta name="preload-data" id="meta-preload-data" content='(.+?)'/);
        if (!preloadDataMatch) {
            console.log('Preload data not found in response.');
            return { status: false };
        }

        const preloadDataObject = JSON.parse(preloadDataMatch[1]);
        const preData = preloadDataObject['illust'][id];
        const { urls, pageCount, tags, illustType } = preData;

        const processedTags = tags['tags']
            .map(tag => {
                const tagName = tag['tag'].toLowerCase();
                return tagName + (tag.translation?.en ? ` (${tag.translation.en})` : '');
            })
            .join(', ');

        let data = [];
        if (illustType === 2) {
            const result = await pixivVideoDownloader(url, cookie);
            data.push(result);
        } else {
            if (!urls.original) {
                return { status: false, message: 'R-18 works cannot be displayed. Cookie needed to view R-18 works.' };
            }
            for (let i = 0; i < pageCount; i++) {
                const pageUrl = Object.fromEntries(
                    Object.entries(urls).map(([key, value]) => [key, value.replace(/_p\d+/, `_p${i}`)])
                );
                const buffer = await pixivImageDownloader(pageUrl.original);
                data.push({ type: path.extname(pageUrl.original).slice(1), buffer });
            }
        }

        return {
            creator: '@ShiroNexo',
            status: true,
            data: {
                title: preData['title'],
                alt: preData['alt'],
                user: preData['userName'],
                desc: preData['description'],
                like: preData['likeCount'],
                view: preData['viewCount'],
                comment: preData['commentCount'],
                tags: processedTags,
                result: data
            }
        };
    } catch (error) {
        console.error("Pixiv Downloader: " + error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'Unknown error'
        };
    }
}

async function pixivBacthDownloader(url, cookie, type = 'illusts') {
    try {
        const id = parseUserId(url);
        const data = await axios.get(`https://www.pixiv.net/ajax/user/${id}/profile/all?lang=en`, {
            headers: getMetadataHeaders(id, cookie)
        }).then(res => res.data);

        const listArtId = Object.keys(data.body[type]);
        let result = [];
        for (let artId of listArtId) {
            const item = await pixivDownloader(artId, cookie);
            result.push(item.data);
        }
        return {
            creator: '@ShiroNexo',
            status: true,
            data: result
        };
    } catch (error) {
        console.error("Pixiv Batch: " + error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'Unknown error'
        };
    }
}

async function cleanup(destination, unzipPath) {
    try {
        fs.unlinkSync(destination);
        fs.rmSync(unzipPath, { recursive: true, force: true });
    } catch (error) {
    }
}

module.exports = { pixivDownloader, pixivBacthDownloader };
