# Nexo AIO Downloader

[![version](https://img.shields.io/npm/v/nexo-aio-downloader)](https://www.npmjs.com/package/nexo-aio-downloader)
[![license](https://img.shields.io/npm/l/nexo-aio-downloader)](https://github.com/ShiroNexo/nexo-aio-downloader/blob/main/LICENSE)

**One library. All platforms.** Download video, audio, and images from 13 platforms using a unified API — all scraped directly from the source, no third‑party APIs.

---

## Supported Sites

| | | | | | |
|---|---|---|---|---|---|
| <img width="20" src="https://cdn.simpleicons.org/instagram/FF0000" /> **Instagram** | <img width="20" src="https://cdn.simpleicons.org/facebook/1877F2" /> **Facebook** | <img width="20" src="https://cdn.simpleicons.org/tiktok/000000" /> **TikTok** | <img width="20" src="https://cdn.simpleicons.org/twitter/1DA1F2" /> **Twitter/X** | <img width="20" src="https://cdn.simpleicons.org/youtube/FF0000" /> **YouTube** | <img width="20" src="https://cdn.simpleicons.org/googledrive/4285F4" /> **Google Drive** |
| <img width="20" src="https://cdn.simpleicons.org/pixiv/2A95FF" /> **Pixiv** | <img width="20" src="https://cdn.simpleicons.org/bilibili/00A1D6" /> **Bilibili** | <img width="20" src="https://cdn.simpleicons.org/pinterest/E60023" /> **Pinterest** | <img width="20" src="https://cdn.simpleicons.org/mega/F00000" /> **Mega** | **Sfile** | **Snack** |
| **CapCut** | | | | | |

> **YouTube** needs Python 3.7+ with `yt-dlp` in PATH. If missing, the YouTube downloader auto‑disables.

---

## Installation

```bash
npm i nexo-aio-downloader
```

---

## Quick Start

```js
const nexo = require('nexo-aio-downloader');

// AIO — auto‑detect site from URL
const result = await nexo.aio('https://...');
// → { creator: '@ShiroNexo', status: true, data: { ... } }
```

---

## API Reference

Every call returns a consistent shape:

```ts
// Success
{ creator: '@ShiroNexo', status: true, data: { ... } }

// Error
{ creator: '@ShiroNexo', status: false, message: 'Error description' }
```

> `nexo.aio()` **throws** `'Unsupported site'` for unknown URLs — use try/catch.

### `nexo.aio(url, [options])`

Auto‑detects the site and routes to the correct downloader.

| Param | Type | Description |
|-------|------|-------------|
| `url` | `string` | Any supported site URL |
| `options` | `object` | `{ proxy?, cookie? }` |

### All Downloaders

```js
nexo.instagram(url, [cookie])
nexo.facebook(url, [proxy])
nexo.tiktok(url)
nexo.twitter(url)
nexo.gdrive(url)
nexo.sfile(url)
nexo.pixiv(url, [cookie])
nexo.snack(url)
nexo.mega(url, [timeout])
nexo.bilibili(url, [{ download, quality, cookie }])
nexo.capcut(url, [meta])
nexo.youtube(url, [quality])
nexo.youtubePlaylist(url, [quality], [folderPath])
nexo.pixivBatch(url, [cookie], [type])
nexo.pinterest.download(url)
nexo.pinterest.search(query, [limit])
nexo.pinterest.profile(username)
```

---

## Examples

### Instagram

Instagram often requires **login cookies** — otherwise you'll get empty data or block errors.

```js
// Without cookie (may fail)
const result = await nexo.instagram('https://www.instagram.com/reel/ABC123/');

// With cookie (recommended)
const result = await nexo.instagram('https://www.instagram.com/p/ABC123/', 'sessionid=xxxx-xxxx');
// Or via aio
const result = await nexo.aio('https://www.instagram.com/p/ABC123/', {
    cookie: 'sessionid=xxxx-xxxx; csrftoken=xxxx; ds_user_id=xxxx',
});
```

**How to get Instagram cookie:**
1. Login to instagram.com in your browser
2. Press F12 → **Application** → **Cookies** → `instagram.com`
3. Copy values for: `sessionid`, `csrftoken`, `ds_user_id`
4. Combine them: `sessionid=...; csrftoken=...; ds_user_id=...`

**Return data:**
```ts
{ url: string[], caption: string, username: string, like: number, comment: number, isVideo: boolean }
```

### Facebook

```js
const result = await nexo.facebook('https://www.facebook.com/share/v/...');

// With proxy
const { HttpsProxyAgent } = require('https-proxy-agent');
const proxy = new HttpsProxyAgent('http://user:pass@host:port');
const result = await nexo.facebook('https://fb.watch/abc123/', proxy);
```

**Return data:**
```ts
{ user: string, quoted: string|null, isPrivate: boolean, result: [{ quality: 'HD'|'SD', type: string, url: string }] }
```

### TikTok

```js
const result = await nexo.tiktok('https://www.tiktok.com/@user/video/123456');
// or short links
const result = await nexo.tiktok('https://vm.tiktok.com/abc123/');
```

**Return data:**
```ts
{
    videoId, description, createTime, videoUrl,
    videoInfo: { size, duration, width, height, definition, coverUrl, subtitles },
    author: { id, uniqueId, nickname, avatarThumb },
    music: { id, title, authorName, playUrl, isOriginal },
    stats: { likes, shares, comments, plays, collects, reposts },
    videoBuffer: Buffer  // Downloaded buffer
}
```

### Twitter / X

```js
const result = await nexo.twitter('https://x.com/user/status/123456789');
```

**Return data:**
```ts
{
    author: string, like: number, view: number, retweet: number,
    description: string, sensitiveContent: boolean,
    result: [{ type: 'video'|'gif'|'image', thumb?: string, url: string }]
}
```

### YouTube

```js
// Quality: 1=144p, 2=360p, 3=480p, 4=720p, 5=1080p, 6=1440p, 7=2160p
//          8=bestaudio, 9=bitrateList

const video = await nexo.youtube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 4);
// → data.result = MP4 Buffer

// List available audio bitrates
const bitrates = await nexo.youtube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 9);
// → data.bitrateList = [{ codec, bitrate, format_id }]

// Download audio at specific bitrate
const audio = await nexo.youtube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 160);

// Playlist
const playlist = await nexo.youtubePlaylist(
    'https://www.youtube.com/playlist?list=PL...',
    4,                       // quality
    './downloads/youtube'    // output folder (default: ./temp)
);
// → data = { title, resultPath: string[], metadata: [...] }
```

**Return data (video/audio):**
```ts
{ title, result: Buffer, size, quality, desc, views, likes, channel, uploadDate, thumb, type }
```

### Google Drive

```js
const result = await nexo.gdrive('https://drive.google.com/file/d/FILE_ID/view');
```

**Return data:**
```ts
{ filename: string, filesize: string, result: Buffer }
```

### Sfile

```js
const result = await nexo.sfile('https://sfile.mobi/FILEKEY');
```

**Return data:**
```ts
{ filename: string, filesize: string, mimetype: string, result: Buffer }
```

### Pixiv

```js
// SFW (no cookie)
const sfw = await nexo.pixiv('https://www.pixiv.net/en/artworks/120829610');
// → data.result = [{ type: 'png'|'gif', buffer }]

// With cookie (R‑18, Ugoira/GIF)
const r18 = await nexo.pixiv('https://www.pixiv.net/en/artworks/...', 'your_PHPSESSID');

// Batch download all works from a user
const batch = await nexo.pixivBatch(
    'https://www.pixiv.net/en/users/25030629',
    'your_PHPSESSID',
    'illust' // illust | manga | novels | mangaSeries | novelSeries
);
// → data = array of artwork results
```

**How to get PHPSESSID:**
1. Login to pixiv.net
2. F12 → Application → Cookies → `www.pixiv.net`
3. Copy the `PHPSESSID` value

**Return data:**
```ts
{ title, alt, user, desc, like, view, comment, tags, result: [{ type, buffer }] }
```

### Bilibili

```js
const result = await nexo.bilibili('https://www.bilibili.tv/id/video/2042507617', {
    download: true,     // true = return MP4 buffer, false = metadata only
    quality: '64',      // 16=360p, 32=480p (default), 64=720p
    cookie: 'SESSDATA=xxxxx',  // optional, needed for 1080p+
});

if (result.status && result.data.result) {
    require('fs').writeFileSync(`${result.data.title}.mp4`, result.data.result);
}
```

**Return data:**
```ts
{
    title, locate, description, type, cover, views, like,
    result: Buffer|null,  // null when download: false
    mediaList: { videoList: [{ quality, quality_id, url }], audioList: [{ size, url }] }
}
```

### CapCut

```js
const result = await nexo.capcut('https://www.capcut.com/t/abc123', true);
// meta=true (default) includes extra metadata like author, likes, play count
```

### Snack

```js
const result = await nexo.snack('https://www.snack.com/video/abc123');
```

**Return data:**
```ts
{ author, description, transcript, thumbnailUrl, uploadDate, comment, audio, result: string (contentUrl) }
```

### Mega

```js
const result = await nexo.mega('https://mega.nz/file/abc123#decryptionKey');
```

**Return data:**
```ts
{ fileName: string, fileSize: number, downloadLink: string }
```

### Pinterest

```js
// Pin metadata + media
const pin = await nexo.pinterest.download('https://id.pinterest.com/pin/774124930087393/');

// Search (max 50)
const search = await nexo.pinterest.search('cats', 10);

// User profile
const profile = await nexo.pinterest.profile('username');
```

---

## Using a Proxy

```js
const { HttpsProxyAgent } = require('https-proxy-agent');
const proxy = new HttpsProxyAgent('http://user:pass@host:port');

// Via aio
await nexo.aio('https://www.facebook.com/...', { proxy });

// Direct
await nexo.facebook('https://www.facebook.com/...', proxy);
```

---

## Requirements

| Dependency | Needed For |
|------------|-----------|
| **Python 3.7+** + `yt-dlp` | YouTube only |
| **ffmpeg** (in PATH) | YouTube & Bilibili video/audio merging |

> If `ffmpeg-static` is installed by npm, it's used automatically. Otherwise the system `ffmpeg` is used.

---

## License

MIT © [ShiroNexo](https://github.com/ShiroNexo)
