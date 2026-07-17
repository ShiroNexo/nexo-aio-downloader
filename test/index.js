const { expect } = require('chai');
const nexo = require('../src/index');

describe('Module Exports', () => {
    it('should export all expected functions', () => {
        expect(nexo).to.have.property('aio').that.is.a('function');
        expect(nexo).to.have.property('bilibili').that.is.a('function');
        expect(nexo).to.have.property('capcut').that.is.a('function');
        expect(nexo).to.have.property('facebook').that.is.a('function');
        expect(nexo).to.have.property('gdrive').that.is.a('function');
        expect(nexo).to.have.property('instagram').that.is.a('function');
        expect(nexo).to.have.property('mega').that.is.a('function');
        expect(nexo).to.have.property('pinterest').that.is.an('object');
        expect(nexo).to.have.property('pixiv').that.is.a('function');
        expect(nexo).to.have.property('pixivBatch').that.is.a('function');
        expect(nexo).to.have.property('sfile').that.is.a('function');
        expect(nexo).to.have.property('snack').that.is.a('function');
        expect(nexo).to.have.property('tiktok').that.is.a('function');
        expect(nexo).to.have.property('twitter').that.is.a('function');
        expect(nexo).to.have.property('youtube').that.is.a('function');
        expect(nexo).to.have.property('youtubePlaylist').that.is.a('function');
    });

    it('should have pinterest with download, search, profile methods', () => {
        expect(nexo.pinterest).to.have.property('download').that.is.a('function');
        expect(nexo.pinterest).to.have.property('search').that.is.a('function');
        expect(nexo.pinterest).to.have.property('profile').that.is.a('function');
    });
});

describe('aio Router - URL Detection', function () {
    this.timeout(15000);

    const testUrls = [
        { site: 'facebook', url: 'https://www.facebook.com/watch?v=123' },
        { site: 'facebook', url: 'https://fb.watch/abc123/' },
        { site: 'instagram', url: 'https://www.instagram.com/p/ABC123/' },
        { site: 'instagram', url: 'https://www.instagram.com/reel/ABC123/' },
        { site: 'tiktok', url: 'https://www.tiktok.com/@user/video/123' },
        { site: 'tiktok', url: 'https://vt.tiktok.com/abc123/' },
        { site: 'tiktok', url: 'https://vm.tiktok.com/abc123/' },
        { site: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' },
        { site: 'youtube', url: 'https://youtu.be/abc123' },
        { site: 'twitter', url: 'https://twitter.com/user/status/123' },
        { site: 'twitter', url: 'https://x.com/user/status/123' },
        { site: 'gdrive', url: 'https://drive.google.com/file/d/abc123/view' },
        { site: 'pixiv', url: 'https://www.pixiv.net/en/artworks/12345678' },
        { site: 'snack', url: 'https://www.snack.com/video/abc123' },
        { site: 'mega', url: 'https://mega.nz/file/abc123#key' },
        { site: 'bilibili', url: 'https://www.bilibili.tv/id/video/123' },
        { site: 'capcut', url: 'https://www.capcut.com/t/abc123' },
        { site: 'pinterest', url: 'https://www.pinterest.com/pin/123' },
        { site: 'pinterest', url: 'https://pin.it/abc123' },
        { site: 'sfile', url: 'https://sfile.mobi/abc123' },
    ];

    testUrls.forEach(({ site, url }) => {
        it(`should detect ${site} from URL: ${url}`, async () => {
            try {
                const result = await nexo.aio(url);
                expect(result).to.have.property('status');
            } catch (err) {
                expect(err.message).to.not.equal('Unsupported site');
            }
        });
    });

async function biliTest() {
    nexo.bilibili(listUrl.bilibili, {
        download: true,
        quality: '32',
        cookie: 'SESSDATA='
    })
        .then((res) => {
            console.log(res.data.mediaList.videoList);
            fs.writeFileSync('test.mp4', res.data.result);
        })
        .catch((err) => {
            console.log(err);
        })
}

        realUrls.forEach(({ site, url }) => {
            it(`should return status true for ${site}`, async () => {
                const result = await nexo.aio(url);
                expect(result).to.have.property('status', true);
                expect(result).to.have.property('data');
            });
        });
    });

    it('should throw error for unsupported URL', async () => {
        try {
            await nexo.aio('https://unsupported-site.com/video');
            expect.fail('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Unsupported site');
        }
    });

async function capcutTest() {
    nexo.capcut('https://www.capcut.com/id-id/templates/vibesaesthetic-7411160567722806584?scene=category&template_scale=9%3A16&enter_from=first_page', false)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        })
}

async function pxivTest() {
    nexo.pixiv('https://www.pixiv.net/en/artworks/120829610')
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
// biliTest()
// twitterTest()
//tiktokTest()
//capcutTest()
pxivTest()
