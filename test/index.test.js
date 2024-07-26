const nexo = require('../src/index');

const listUrl = {
    twitter: "https://twitter.com/x_cast_x/status/1809598797603041498?t=tXO1JdAR1Avm2BY5wNQX-w&s=19",
    instagram: "https://www.instagram.com/reel/C9cFHKIySEu/?igsh=NnhmdmppdHo3dm9o",
    facebook: "https://www.facebook.com/share/r/WsMBxDEAWcMVXCf9/?mibextid=D5vuiz",
    tiktok: "https://vm.tiktok.com/ZSYnnbXW7",
    "google-drive": "https://drive.google.com/file/d/1E8fOgl4nu4onGR756Lw2ZAVv6NgP1H74/view?usp=drive_link",
    sfile: "https://sfile.mobi/5g9STNCU525"
}

async function AIOTest() {
    Object.keys(listUrl).forEach(async (key) => {
        await nexo.aio(listUrl[key]).then((res) => {
            console.log(`\nTest ${res.status ? 'passed 🟢' : 'failed 🔴'} for ${key}:`);
            console.log(res);
        }).catch((err) => {
            console.log(`Test failed 🔴 for ${key}:\n${JSON.stringify(err, null, 2)}\n`);
        })
    })
}

async function youtubeTest() {
    nexo.youtube('https://www.youtube.com/watch?v=IOGP3vcbKBg', 2)
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
    nexo.bilibili('https://www.bilibili.tv/id/video/4791529255207424?bstar_from=bstar-web.homepage.recommend.all')
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        })
}

//AIOTest()
//youtubeTest()
//youtubeShortTest()
biliTest()