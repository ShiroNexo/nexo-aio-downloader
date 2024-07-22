# All In One Downloader

Download Media From Multiple Website Using One Repo.

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
    const insta = await nexo.instagramDownloader(listUrl.instagram)
    console.log(insta)

    // Facebook Downloader
    const fb = await nexo.facebookDownloader(listUrl.facebook)
    console.log(insta)

    // ETC....
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