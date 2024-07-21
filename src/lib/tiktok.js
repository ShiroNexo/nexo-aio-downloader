const axios = require('axios');
const FormData = require('form-data');

async function tiktokDownloader(url) {
    try {
        const formData = new FormData();
        formData.append('query', url);

        let data = await axios.post('https://lovetik.com/api/ajax/search', formData, {
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Dnt': '1',
                'Origin': 'https://lovetik.com',
                'Pragma': 'no-cache',
                'Priority': 'u=1, i',
                'Referer': 'https://lovetik.com/',
                'Sec-Ch-Ua': '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
                'X-Requested-With': 'XMLHttpRequest',
            }
        }).then(response => {
            return response.data
        })

        if (data.status !== 'ok') return { creator: '@ShiroNexo', status: false, message: data.message || 'Something went wrong!' }
        if (data.links.length === 0) return { creator: '@ShiroNexo', status: false, message: 'No results found!' }

        return {
            creator: '@ShiroNexo',
            status: true,
            data: { 
                author: data.author,
                desc: data.desc,
                cover: data.cover,
                result: filterLovetik(data.links)
            }
        }
    } catch (error) {
        console.log(error)
        return { creator: '@ShiroNexo', status: false, message: error.message || 'Something went wrong!' }
    }
}

function filterLovetik(data) {
    let temp = []
    let mp4NoWm = []
    let mp4Wm = []
    let audio = []

    for (let i = 0; i < data.length; i++) {
        if (data[i].ft == 1 && !temp.includes(data[i].s)) {
            mp4NoWm.push(data[i].a)
            temp.push(data[i].s)
        } else if (data[i].ft == 2 && !temp.includes(data[i].s)) {
            mp4Wm.push(data[i].a)
            temp.push(data[i].s)
        } else if (data[i].ft == 3 && !temp.includes(data[i].s)) {
            audio.push(data[i].a)
            temp.push(data[i].s)
        }
    }

    return { mp4NoWm, mp4Wm, audio }
}


module.exports = tiktokDownloader