const { expect } = require('chai');
const nexo = require('../src/index');

describe('INTEGRATION — All Downloaders (Real URLs)', function () {
    this.timeout(60000);

    // ── Instagram ──────────────────────────────────────────────
    describe('Instagram', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://www.instagram.com/p/DX7MjkfsEZj', {
                cookie: process.env.IG_COOKIE || '',
            });
            console.log('  Instagram:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.url?.length || 0} media`);
            if (!r.status) {
                console.log('    (No cookie provided — Instagram often requires login)');
            }
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.instagram('https://www.instagram.com/p/DX7MjkfsEZj',
                process.env.IG_COOKIE || '');
            console.log('  Instagram direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── Facebook ───────────────────────────────────────────────
    describe('Facebook', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://www.facebook.com/share/v/1Atp5uiiW5');
            console.log('  Facebook:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.result?.length || 0} media`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.facebook('https://www.facebook.com/share/v/1Atp5uiiW5');
            console.log('  Facebook direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── TikTok ─────────────────────────────────────────────────
    describe('TikTok', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://www.tiktok.com/@son1x.edit/video/7069734588578270470');
            console.log('  TikTok:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.videoUrl ? 'has video' : 'no video'}`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.tiktok('https://www.tiktok.com/@son1x.edit/video/7069734588578270470');
            console.log('  TikTok direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── Twitter / X ────────────────────────────────────────────
    describe('Twitter/X', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://x.com/apatawani/status/1911076115873185971');
            console.log('  Twitter:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.result?.length || 0} media`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.twitter('https://x.com/apatawani/status/1911076115873185971');
            console.log('  Twitter direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── YouTube ────────────────────────────────────────────────
    describe('YouTube', () => {
        it('should return status + data (aio router, no download)', async () => {
            const r = await nexo.aio('https://www.youtube.com/watch?v=sNhFi-xBEVU');
            console.log('  YouTube aio:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.title || 'no title'}`);
        });

        it('should return status + data (direct, quality=720p)', async () => {
            const r = await nexo.youtube('https://www.youtube.com/watch?v=sNhFi-xBEVU', 4);
            console.log('  YouTube 720p:', r.status ? `OK (${r.data?.size || '?'} b)` : 'FAIL');
        });

        it('should return bitrate list (quality=9)', async () => {
            const r = await nexo.youtube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 9);
            console.log('  YouTube bitrates:', r.status ? `${r.data?.bitrateList?.length || 0} options` : 'FAIL');
        });
    });

    // ── Google Drive ───────────────────────────────────────────
    describe('Google Drive', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://drive.google.com/file/d/1E8fOgl4nu4onGR756Lw2ZAVv6NgP1H74');
            console.log('  GDrive:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.filename || '?'} (${r.data?.filesize || '?'})`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.gdrive('https://drive.google.com/file/d/1E8fOgl4nu4onGR756Lw2ZAVv6NgP1H74');
            console.log('  GDrive direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── Sfile ──────────────────────────────────────────────────
    describe('Sfile', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://sfile.co/5g9STNCU525');
            console.log('  Sfile:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.filename || '?'} (${r.data?.filesize || '?'})`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.sfile('https://sfile.co/5g9STNCU525');
            console.log('  Sfile direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── Pixiv ──────────────────────────────────────────────────
    describe('Pixiv', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://www.pixiv.net/en/artworks/143719305');
            console.log('  Pixiv:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.result?.length || 0} images`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.pixiv('https://www.pixiv.net/en/artworks/143719305');
            console.log('  Pixiv direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── Bilibili ───────────────────────────────────────────────
    describe('Bilibili', () => {
        it('should return status + data (aio router, metadata only)', async () => {
            const r = await nexo.aio('https://www.bilibili.tv/id/video/2042507617');
            console.log('  Bilibili:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.title || '?'} (${r.data?.views || '?'} views)`);
        });

        it('should return metadata (direct, download=false)', async () => {
            const r = await nexo.bilibili('https://www.bilibili.tv/id/video/2042507617', { download: false });
            console.log('  Bilibili meta:', r.status ? `OK — ${r.data?.title} (${r.data?.mediaList?.videoList?.length || 0} qualities)` : 'FAIL');
        });

        it('should download video (direct, download=true)', async () => {
            const r = await nexo.bilibili('https://www.bilibili.tv/id/video/2042507617', { download: true, quality: '32' });
            console.log('  Bilibili dl:', r.status ? `OK (${r.data?.result?.length || 0} bytes)` : 'FAIL');
        });
    });

    // ── Mega ───────────────────────────────────────────────────
    describe('Mega', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://mega.nz/file/FyxA3CrK#Rg1t01Q_WwKk1v_vFWd44hBFo66YwOSNLJLpDfOxRbk');
            console.log('  Mega:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.fileName || '?'} (${r.data?.fileSize || '?'})`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.mega('https://mega.nz/file/FyxA3CrK#Rg1t01Q_WwKk1v_vFWd44hBFo66YwOSNLJLpDfOxRbk');
            console.log('  Mega direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── Snack ──────────────────────────────────────────────────
    describe('Snack', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://www.snack.com/video/test123');
            console.log('  Snack:', r.status ? 'OK' : 'FAIL', '—', r.message || JSON.stringify(r.data).slice(0, 100));
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.snack('https://www.snack.com/video/test123');
            console.log('  Snack direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── CapCut ─────────────────────────────────────────────────
    describe('CapCut', () => {
        it('should return status + data (aio router)', async () => {
            const r = await nexo.aio('https://www.capcut.com/t/NCJT7mBzfZP');
            console.log('  CapCut:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.title || '?'} (${r.data?.link?.length || 0} b)`);
        });

        it('should return status + data (direct)', async () => {
            const r = await nexo.capcut('https://www.capcut.com/t/NCJT7mBzfZP', true);
            console.log('  CapCut direct:', r.status ? 'OK' : 'FAIL');
        });
    });

    // ── Pinterest ──────────────────────────────────────────────
    describe('Pinterest', () => {
        it('should return status + data (download pin via aio)', async () => {
            const r = await nexo.aio('https://www.pinterest.com/pin/774124930087393/');
            console.log('  Pinterest:', r.status ? 'OK' : 'FAIL', '—', r.message || `${r.data?.url ? 'has media' : 'no media'}`);
        });

        it('should download pin (direct)', async () => {
            const r = await nexo.pinterest.download('https://www.pinterest.com/pin/774124930087393/');
            console.log('  Pinterest pin:', r.status ? 'OK' : 'FAIL');
        });

        it('should search (direct)', async () => {
            const r = await nexo.pinterest.search('cats', 3);
            console.log('  Pinterest search:', r.status ? `OK (${r.data?.length || 0} results)` : 'FAIL');
        });
    });

    // ── YouTube Playlist ───────────────────────────────────────
    describe('YouTube Playlist', () => {
        it('should return metadata (direct, no download)', async () => {
            const r = await nexo.youtubePlaylist(
                'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
                1,
                null
            );
            console.log('  YT Playlist:', r.status ? `OK (${r.data?.title || '?'}, ${r.data?.resultPath?.length || 0} vids)` : 'FAIL');
        });
    });

    // ── Pixiv Batch ────────────────────────────────────────────
    describe('Pixiv Batch', () => {
        it('should return status for batch (needs cookie)', async () => {
            const r = await nexo.pixivBatch(
                'https://www.pixiv.net/en/users/25030629',
                process.env.PIXIV_COOKIE || '',
                'illust'
            );
            console.log('  Pixiv Batch:', r.status ? `OK (${r.length || r.data?.length || 0} items)` : `FAIL — ${r.message || ''}`);
            if (!r.status && !process.env.PIXIV_COOKIE) {
                console.log('    (No cookie provided — Pixiv batch requires login)');
            }
        });
    });

    // ── Summary ────────────────────────────────────────────────
    after(() => {
        console.log('\n═══════════════════════════════════════════');
        console.log('  Integration test complete.');
        console.log('  Some failures are expected without cookies/proxy.');
        console.log('  Instagram, Facebook, Twitter often block headless requests.');
        console.log('═══════════════════════════════════════════\n');
    });
});
