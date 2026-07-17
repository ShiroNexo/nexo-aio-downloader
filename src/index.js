const instagramDownloader = require('./lib/instagram');
const facebookDownloader = require('./lib/facebook');
const { youtubeDownloader, youtubePlaylistDownloader } = require('./lib/youtube');
const twitterDownloader = require('./lib/twitter');
const tiktokDownloader = require('./lib/tiktok');
const gdriveDownloader = require('./lib/gdrive');
const sfileDownloader = require('./lib/sfile');
const { pixivDownloader, pixivBatchDownloader } = require('./lib/pixiv');
const snackDownloader = require('./lib/snack');
const bilibiliDownloader = require('./lib/bilibili');
const capcutDownloader = require('./lib/capcut');
const pinterest = require('./lib/pinterest');
const megaDownloader = require('./lib/mega');

const SITES = {
    facebook: {
        regex: /https?:\/\/(www\.)?facebook\.com|https?:\/\/m\.facebook\.com|https?:\/\/fb\.watch/,
        handler: (url, opts) => facebookDownloader(url, opts.proxy),
    },
    instagram: {
        regex: /https?:\/\/(www\.)?instagram\.com/,
        handler: (url, opts) => instagramDownloader(url, opts.cookie),
    },
    tiktok: {
        regex: /https?:\/\/(www\.)?tiktok\.com|https?:\/\/vt\.tiktok\.com|https?:\/\/vm\.tiktok\.com/,
        handler: (url) => tiktokDownloader(url),
    },
    youtube: {
        regex: /https?:\/\/(www\.)?youtube\.com|https?:\/\/m\.youtube\.com|https?:\/\/youtu\.be/,
        handler: (url) => youtubeDownloader(url),
    },
    twitter: {
        regex: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/.+/,
        handler: (url) => twitterDownloader(url),
    },
    gdrive: {
        regex: /https?:\/\/drive\.google\.com/,
        handler: (url) => gdriveDownloader(url),
    },
    pixiv: {
        regex: /https?:\/\/(www\.)?pixiv\.net/,
        handler: (url, opts) => pixivDownloader(url, opts.cookie),
    },
    snack: {
        regex: /https?:\/\/(www\.)?snack\.com/,
        handler: (url) => snackDownloader(url),
    },
    mega: {
        regex: /https?:\/\/mega\.nz/,
        handler: (url) => megaDownloader(url),
    },
    bilibili: {
        regex: /https?:\/\/(www\.)?bilibili\.tv/,
        handler: (url) => bilibiliDownloader(url, { download: true }),
    },
    capcut: {
        regex: /https?:\/\/(?:www\.)?capcut\.com\/t\/[a-zA-Z0-9]+/,
        handler: (url) => capcutDownloader(url),
    },
    pinterest: {
        regex: /^https?:\/\/(?:www\.)?(?:pinterest|pinterestcn)\.[\w.]+\/|^https?:\/\/pin\.it\/[\w.-]+/,
        handler: (url) => pinterest.download(url),
    },
    sfile: {
        regex: /https?:\/\/(?:www\.)?sfile\.(?:mobi|co)/,
        handler: (url) => sfileDownloader(url),
    },
};

async function allInOne(url, { proxy = null, cookie = null } = {}) {
    try {
        const site = Object.keys(SITES).find(key => SITES[key].regex.test(url));
        if (!site) throw new Error('Unsupported site');

        return await SITES[site].handler(url, { proxy, cookie });
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}

module.exports = {
    aio: allInOne,
    bilibili: bilibiliDownloader,
    capcut: capcutDownloader,
    facebook: facebookDownloader,
    gdrive: gdriveDownloader,
    instagram: instagramDownloader,
    mega: megaDownloader,
    pinterest: pinterest,
    pixiv: pixivDownloader,
    pixivBatch: pixivBatchDownloader,
    sfile: sfileDownloader,
    snack: snackDownloader,
    tiktok: tiktokDownloader,
    twitter: twitterDownloader,
    youtube: youtubeDownloader,
    youtubePlaylist: youtubePlaylistDownloader,
};
