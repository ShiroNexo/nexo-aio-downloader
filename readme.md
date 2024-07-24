# All In One Downloader

Download Media From Multiple Website Using One Library.

Allmost all downloader scrape directly from the sites without 3rd api.

# Available Sites
Still Adding New More...

- [✅] instagram
- [✅] facebook
- [✅] tiktok
- [✅] twitter
- [✅] youtube
- [✅] googleDrive
- [✅] sfile
- [✅] pixiv

# Usage

### Installation:

```bash
npm i nexo-aio-downloader
```

## Example
For more example will added in future.

```js
const nexo = require("nexo-aio-downloader");

// Some Example Url
const listUrl = {
    twitter: "https://twitter.com/x_cast_x/status/1809598797603041498?t=tXO1JdAR1Avm2BY5wNQX-w&s=19",
    instagram: "https://www.instagram.com/reel/C9cFHKIySEu/?igsh=NnhmdmppdHo3dm9o",
    facebook: "https://www.facebook.com/share/r/WsMBxDEAWcMVXCf9/?mibextid=D5vuiz",
    tiktok: "https://vm.tiktok.com/ZSYnnbXW7",
    "google-drive": "https://drive.google.com/file/d/1E8fOgl4nu4onGR756Lw2ZAVv6NgP1H74/view?usp=drive_link",
    sfile: "https://sfile.mobi/5g9STNCU525"
}

(async () => {
    // All In One For Available Sites
    const result = await nexo.aio('any_url')
    console.log(result)

    // Instagram Downloader
    const insta = await nexo.instagram(listUrl.instagram)
    console.log(insta)

    // Facebook Downloader
    const fb = await nexo.facebook(listUrl.facebook)
    console.log(insta)

    // ETC....
})()
```

## Youtube Example

```js
const nexo = require("nexo-aio-downloader");

// Example Url
const youtubeUrl = 'https://youtu.be/X_-449tJ7ys?si=iZoyMxNfqZC1iYKf'

// 1: 144p || 2: 360p || 3: 480p || 4: 720p || 5: 1080p || 6: 1440p || 7: 2160p || 8: highestaudio/mp3/audio || 9: bitrate List
const quality = 3

// Check Available Bitrate For Audio
const bitrateList = 9

(async () => {
    // Download Custom Quality Youtube
    const youtube = await nexo.youtube(youtubeUrl, quality)
    console.log(youtube)

    // Download Custom Bitrate Audio
    const bitList = await nexo.youtube(youtubeUrl, bitrateList)

    /**
    Ouput Bitrate Example
    {
        "creator": "@ShiroNexo",
        "status": "true,
        "data": {
            "bitrateList": [
                {
                    "codec": "opus",
                    "bitrate": 160,
                    "itag": 251
                },
                {
                    "codec": "mp4a.40.2",
                    "bitrate": 128,
                    "itag": 140
                },
                // Etc...
            ]
        }
    }
    **/

    const customAudio =  await nexo.youtube(youtubeUrl, 140)
    console.log(customAudio)
    // ETC....
})()
```

## Pixiv Example
For R-18 works require cookie

```js
const nexo = require("nexo-aio-downloader");

// Example Url
const pixivUrl = 'https://www.pixiv.net/en/artworks/120829610'

// You Can Use The PHPSESSID= Cookie.
const cookie = '55511249_rVrZ0ygXjti1WfuDahh4yCDE4Qo5UUqNK' // This Just Example Cookie

(async () => {
    // Without Cookie
    const pixiv = await nexo.pixiv(pixivUrl)
    console.log(pixiv)

    // Download Custom Bitrate Audio
    const pixiv18 = await nexo.pixiv(pixivUrl, cookie)
    console.log(pixiv18)

    /**
    Ouput Example
    {
        "creator": "@ShiroNexo",
        "status": "true,
        "data": {
            data: {
                title: 'ニヤニヤ教授',
                alt: 'Blue Archive, BlueArchive / ニヤニヤ教授 / July 24th, 2024',
                user: 'maho',
                desc: '',
                like: 146,
                view: 1161,
                comment: 2,
                tags: 'ブルーアーカイブ (Blue Archive), ブルアカ, bluearchive, 블루아카이브, ニヤニヤ教授',
                result: [ 
                    {
                        type: 'gif' // jpg || gif
                        buffer: <buffer>
                    }
                ]
            }
        }
    }
    **/
})()
```

### How To Get Cookie:
1. Login to pixiv using your account
2. Open the developer tools (<kbd>F12</kbd>, <kbd>Ctrl+Shift+I</kbd>, or <kbd>Cmd+J</kbd>)
3. Go to the `Application` tab
4. Go to the `Storage` section and click on `Cookies`
5. Look for the `PHPSESSID`
6. Open the object, right click on value and copy your session token.

![PHPSESSID](https://i.ibb.co.com/ZHq7bPb/Screenshot-2024-07-24-123651.png)

## Youtube Playlist Example

```js
const nexo = require("nexo-aio-downloader");

// Example Url
const playlistUrl = 'https://www.youtube.com/playlist?list=PL8mG-RkN2uTzbbUgvbn2YzBLLU3wktwo0'

// 1: 144p || 2: 360p || 3: 480p || 4: 720p || 5: 1080p || 6: 1440p || 7: 2160p || 8: highestaudio/mp3/audio
const quality = 3

// If Null Will Create New ./temp Directory
const dirPath = './youtube'

(async () => {
    // The Download Will Saved Into Folder
    const youtube = await nexo.youtubePlaylist(youtubeUrl, quality, dirPath)
    console.log(youtube)

    /**
    Ouput Example
    {
        "creator": "@ShiroNexo",
        "status": "true,
        "data": {
            title: 'xxx'
            resultPath: [ './xx/xx.mp4' ]
            metadata: { xxx }
        }
    }
    **/
})()
```

# Example Using Proxy
For like instagram that have ip limit

```js
const nexo = require("nexo-aio-downloader");
const { HttpsProxyAgent } = require('https-proxy-agent');

const username = 'example_user'
const password = 'example'
const hostname = 'ex.ample.com'
const port = 6060

const httpsProxyAgent = new HttpsProxyAgent(`http://${username}:${password}@${hostname}:${port}`); // Use HttpsProxyAgent

// Some Example Url
const url = "https://www.instagram.com/reel/C9cFHKIySEu/?igsh=NnhmdmppdHo3dm9o"

(async () => {
    // Using Proxy
    const result = await nexo.aio(url, httpsProxyAgent)
    console.log(result)
})()
```

## License

nexo-aio-downloader is licensed under the [MIT License](https://opensource.org/licenses/MIT). Please refer to the LICENSE file for more information.