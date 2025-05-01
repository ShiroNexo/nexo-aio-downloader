# All In One Downloader

Download Media From Multiple Website Using One Library.

Allmost all downloader scrape directly from the sites without 3rd api.

# Available Sites
Still Adding New More...

<table>
  <tr>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/instagram/FF0000"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Instagram</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/facebook/1877F2"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Facebook</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/tiktok/000000"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Tiktok</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/x/1DA1F2"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Twitter</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/youtube/FF0000"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Youtube</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/googledrive/4285F4"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>GoogleDrive</b>
    </td>
  </tr>
  <tr>
    <td align="center" width="40px">
      <img src="https://logos-world.net/wp-content/uploads/2024/01/CapCut-Symbol.png"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Capcut</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/pixiv/2A95FF"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Pixiv</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/mega/F00000"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Mega</b>
    </td>
    <td align="center" width="40px">
      <img src="https://1.bp.blogspot.com/-PuWtJg49s_0/YCPIGwfvu6I/AAAAAAAAD40/qSgEwMEWRB0u8yxozbojxWGChflTDrX8ACLcBGAsYHQ/s1600/Logo%2BSnack%2BVideo.png"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Snack</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/pinterest/E60023"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Pinterest</b>
    </td>
    <td align="center" width="40px">
      <img src="https://cdn.simpleicons.org/bilibili/00A1D6"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Bilibili</b>
    </td>
  </tr>
  <tr>
    <td align="center" width="40px">
      <img src="https://sfile.mobi/icon/sfile-icon-192x192.png"
           style="width: 30px; height: 30px; object-fit: contain; display: block;" /><br>
      <b>Sfile</b>
    </td>
  </tr>
</table>




# Required (OPTIONAL)
> Youtube requires Python 3.7 or above available in your system as python3. Otherwise, the youtube downloader get disable.


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
const youtubeUrl = 'https://www.youtube.com/watch?v=oOIztBXox60'


// Playlist Example
const playlistUrl = 'https://www.youtube.com/playlist?list=PL8mG-RkN2uTzbbUgvbn2YzBLLU3wktwo0'

// 1: 144p || 2: 360p || 3: 480p || 4: 720p || 5: 1080p || 6: 1440p || 7: 2160p || 8: highestaudio/mp3/audio || 9: bitrate List
const quality = 3

// Check Available Bitrate For Audio
const bitrateList = 9

// Playlist Need Directory
// If Null Will Create New ./temp Directory
const dirPath = './youtube'

(async () => {
    // Download Custom Quality Youtube
    const youtube = await nexo.youtube(youtubeUrl, quality)
    console.log(youtube)

    // The Download Will Saved Into Folder
    const youtubePlaylist = await nexo.youtubePlaylist(playlistUrl, quality, dirPath)
    console.log(youtubePlaylist)

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

    const customAudio =  await nexo.youtube(youtubeUrl, 160) // (videoUrl, bitrate)
    console.log(customAudio)
    // ETC....
})()
```


## Pixiv Example
For R-18 works require cookie

```js
const nexo = require("nexo-aio-downloader");

// Example Url
const pixivUrl = 'https://www.pixiv.net/en/artworks/120829610'// Support URL And IllustID

//Example Batch Download
const userUrl = 'https://www.pixiv.net/en/users/25030629' // Support URL And UserID
const type = 'illust' // illust || manga || novels || mangaSeries || novelSeries || default was illust

// You Can Use The PHPSESSID= Cookie.
const cookie = '55511249_rVrZ0ygXjti1WfuDahh4yCDE4Qo5UUqNK' // This Just Example Cookie

(async () => {
    // Without Cookie
    const pixiv = await nexo.pixiv(pixivUrl)
    console.log(pixiv)

    // Download using cookie
    const pixiv18 = await nexo.pixiv(pixivUrl, cookie)
    console.log(pixiv18)

    // Download Batch
    const pixivbatch = await nexo.pixivBatch(pixivUrl, cookie, type)
    console.log(batch)
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


## Bilibili Example

```js
const nexo = require("nexo-aio-downloader");

// Example Url
const biliUrl = 'https://www.bilibili.tv/id/video/4791529255207424?bstar_from=bstar-web.homepage.recommend.all'

// 144P || 240P || 360P || 480P || 720P
const quality = '480P' // Default 480P

(async () => {
    // Download Custom Quality Bilibili
    const bili = await nexo.bilibili(biliUrl, quality)
    console.log(bili)
})()
```

## PINTEREST Example

```js
const nexo = require("nexo-aio-downloader");

// Example Url
const pinUrl = 'https://id.pinterest.com/pin/774124930087393/'

(async () => {
    // Download Pinterest
    const pinDownload = await nexo.pinterest.download(pinUrl)
    console.log(pinDownload)

    // Pinterest Search
    // Size optional
    const pinSearch = await nexo.pinterest.search('cat', 10)
    console.log(pinSearch)

    // Pinterest Profile
    const pinProfile = await nexo.pinterest.profile('anon')
    console.log(pinProfile)
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