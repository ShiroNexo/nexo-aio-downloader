const nexo = require('../src/index');

const listUrl = {
    twitter: " https://x.com/i/status/1911076115873185971",
    // instagram: "https://www.instagram.com/reel/C9cFHKIySEu/?igsh=NnhmdmppdHo3dm9o",
    // facebook: "https://www.facebook.com/share/r/WsMBxDEAWcMVXCf9/?mibextid=D5vuiz",
    // tiktok: "https://vt.tiktok.com/ZSYvhPG55/",
    // "google-drive": "https://drive.google.com/file/d/1E8fOgl4nu4onGR756Lw2ZAVv6NgP1H74/view?usp=drive_link",
    // sfile: "https://sfile.mobi/5g9STNCU525",
    // bilibili: "https://www.bilibili.tv/id/video/4794971188762624?bstar_from=bstar-web.homepage.trending.all"
}

async function AIOTest() {
    Object.keys(listUrl).forEach(async (key) => {
        await nexo.aio(listUrl[key]).then((res) => {
            console.log(`\nTest ${res.status ? 'passed 🟢' : 'failed 🔴'} for ${key}:`);
            console.log(res.data);
        }).catch((err) => {
            console.log(err)
            console.log(`Test failed 🔴 for ${key}:\n${JSON.stringify(err, null, 2)}\n`);
        })
    })
}

async function youtubeTest() {
    nexo.youtube('https://www.youtube.com/watch?v=oOIztBXox60', 2)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function youtubeShortTest() {
    nexo.youtube('https://www.youtube.com/shorts/srYn6AwgczE', 2)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function pixivTest() {
    nexo.pixiv('https://www.pixiv.net/en/artworks/120829610')
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function biliTest() {
    nexo.bilibili(listUrl.bilibili)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function twitterTest() {
    nexo.twitter(listUrl.twitter)
        .then((res) => {
            console.log(res.data);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function tiktokTest() {
    nexo.tiktok(listUrl.tiktok)
        .then((res) => {
            console.log(res.data);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function capcutTest() {
    nexo.capcut('https://www.capcut.com/id-id/templates/vibesaesthetic-7411160567722806584?scene=category&template_scale=9%3A16&enter_from=first_page')
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        })
}

// AIOTest()
//youtubeTest()
//youtubeShortTest()
//biliTest()
// twitterTest()
//tiktokTest()
capcutTest()