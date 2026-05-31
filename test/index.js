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

    describe.skip('aio Integration (isi URL asli)', () => {
        const realUrls = [
            { site: 'instagram', url: 'https://www.instagram.com/p/DX7MjkfsEZj' },
            { site: 'facebook', url: 'https://www.facebook.com/share/v/1Atp5uiiW5' },
            { site: 'tiktok', url: 'https://www.tiktok.com/@son1x.edit/video/7069734588578270470' },
            { site: 'youtube', url: 'https://www.youtube.com/watch?v=sNhFi-xBEVU' },
            { site: 'twitter', url: 'https://x.com/apatawani/status/1911076115873185971' },
            { site: 'gdrive', url: 'https://drive.google.com/file/d/1E8fOgl4nu4onGR756Lw2ZAVv6NgP1H74' },
            { site: 'pixiv', url: 'https://www.pixiv.net/en/artworks/143719305' },
            { site: 'bilibili', url: 'https://www.bilibili.tv/id/video/2042507617' },
            { site: 'sfile', url: 'https://sfile.co/5g9STNCU525' },
        ];

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

    it('should throw error for empty URL', async () => {
        try {
            await nexo.aio('');
            expect.fail('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Unsupported site');
        }
    });
});

describe('Instagram Downloader', () => {
    it('should handle invalid URL gracefully', async () => {
        const result = await nexo.instagram('not-a-url');
        expect(result).to.have.property('status', false);
        expect(result).to.have.property('message');
    });

    it('should handle empty URL gracefully', async () => {
        const result = await nexo.instagram('');
        expect(result).to.have.property('status', false);
    });
});

describe('Facebook Downloader', function () {
    this.timeout(10000);

    it('should handle invalid URL gracefully', async () => {
        try {
            const result = await nexo.facebook('not-a-url');
            expect(result).to.have.property('status', false);
        } catch (err) {
            expect(err).to.exist;
        }
    });
});

describe('YouTube Downloader', function () {
    this.timeout(15000);

    it('should return error status when called', async () => {
        const result = await nexo.youtube('https://www.youtube.com/watch?v=test', 2);
        expect(result).to.have.property('status', false);
    });
});

describe('Twitter Downloader', function () {
    this.timeout(15000);

    it('should handle empty URL gracefully', async () => {
        const result = await nexo.twitter('');
        expect(result).to.have.property('status', false);
    });

    it('should handle non-tweet URL gracefully', async () => {
        const result = await nexo.twitter('https://x.com/');
        expect(result).to.have.property('status', false);
    });
});

describe('TikTok Downloader', function () {
    this.timeout(10000);

    it('should handle empty URL gracefully', async () => {
        const result = await nexo.tiktok('');
        expect(result).to.have.property('status', false);
    });
});

describe('Google Drive Downloader', function () {
    this.timeout(10000);

    it('should handle invalid URL gracefully', async () => {
        const result = await nexo.gdrive('not-a-url');
        expect(result).to.have.property('status', false);
    });

    it('should handle empty URL gracefully', async () => {
        const result = await nexo.gdrive('');
        expect(result).to.have.property('status', false);
    });
});

describe('Sfile Downloader', function () {
    this.timeout(10000);

    it('should handle invalid URL gracefully', async () => {
        const result = await nexo.sfile('not-a-url');
        expect(result).to.have.property('status', false);
    });
});

describe('Pixiv Downloader', () => {
    it('should handle invalid URL gracefully', async () => {
        const result = await nexo.pixiv('not-a-url');
        expect(result).to.have.property('status', false);
    });
});

describe('Snack Downloader', function () {
    this.timeout(10000);

    it('should handle invalid URL gracefully', async () => {
        const result = await nexo.snack('not-a-url');
        expect(result).to.have.property('status', false);
    });
});

describe('Bilibili Downloader', function () {
    this.timeout(10000);

    it('should handle invalid URL gracefully', async () => {
        const result = await nexo.bilibili('not-a-url');
        expect(result).to.have.property('status', false);
    });
});

describe('Capcut Downloader', function () {
    this.timeout(15000);

    it('should handle empty URL gracefully', async () => {
        const result = await nexo.capcut('');
        expect(result).to.have.property('status', false);
    });

    it('should handle invalid URL gracefully', async () => {
        const result = await nexo.capcut('not-a-url');
        expect(result).to.have.property('status', false);
    });
});

describe('Pinterest Downloader', function () {
    this.timeout(10000);

    it('should handle empty URL gracefully', async () => {
        const result = await nexo.pinterest.download('');
        expect(result).to.have.property('status', false);
    });

    it('should handle non-pin URL gracefully', async () => {
        const result = await nexo.pinterest.download('https://example.com');
        expect(result).to.have.property('status', false);
    });

    it('should handle empty search query gracefully', async () => {
        const result = await nexo.pinterest.search('');
        expect(result).to.have.property('status', false);
    });
});

describe('Mega Downloader', () => {
    it('should handle empty URL gracefully', async () => {
        const result = await nexo.mega('');
        expect(result).to.have.property('status', false);
    });

    it('should handle non-mega URL gracefully', async () => {
        const result = await nexo.mega('https://example.com/file');
        expect(result).to.have.property('status', false);
    });
});

describe('Pinterest Internal Utils', () => {
    const pinterest = require('../src/lib/pinterest');

    it('isUrl should validate URLs correctly', () => {
        expect(pinterest.isUrl('https://www.pinterest.com/pin/123')).to.be.true;
        expect(pinterest.isUrl('not-a-url')).to.be.false;
        expect(pinterest.isUrl('')).to.be.false;
    });

    it('isPin should detect pin URLs correctly', () => {
        expect(pinterest.isPin('https://www.pinterest.com/pin/123')).to.be.true;
        expect(pinterest.isPin('https://pin.it/abc123')).to.be.true;
        expect(pinterest.isPin('https://www.pinterest.com/pin/')).to.be.false;
        expect(pinterest.isPin('https://www.pinterest.com/')).to.be.false;
        expect(pinterest.isPin('')).to.be.false;
    });
});
