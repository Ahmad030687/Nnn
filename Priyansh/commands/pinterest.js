module.exports.config = {
    name: "pinterest",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Image search",
    commandCategory: "Search",
    usePrefix: false,
    usages: "[Text]",
    cooldowns: 0,
};
module.exports.run = async function({ api, event, args }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const keySearch = args.join(" ");
    if(!keySearch.includes("-")) return api.sendMessage('Please enter in the format, example: pinterest Priyansh - 10 (it depends on you how many images you want to appear in the result)', event.threadID, event.messageID)
    const keySearchs = keySearch.substr(0, keySearch.indexOf('-'))
    const numberSearch = keySearch.split("-").pop() || 6
    try {
        const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keySearchs)}&per_page=${numberSearch}`, {
            headers: {
                Authorization: '563492ad6f917000010000016b6d8d33a9a2b4e2f7d3a3e3e3e3e3e3e3e3e3'
            }
        });
        const data = res.data.photos;
        var num = 0;
        var imgData = [];
        for (var i = 0; i < parseInt(numberSearch); i++) {
          if(data[i]) {
            let path = __dirname + `/cache/${num+=1}.jpg`;
            let getDown = (await axios.get(`${data[i].src.large}`, { responseType: 'arraybuffer' })).data;
            fs.writeFileSync(path, Buffer.from(getDown));
            imgData.push(fs.createReadStream(__dirname + `/cache/${num}.jpg`));
          }
        }
        api.sendMessage({
            attachment: imgData,
            body: numberSearch + ' Search results for keyword: '+ keySearchs
        }, event.threadID, event.messageID)
        for (let ii = 1; ii <= num; ii++) {
            fs.unlinkSync(__filename + `/cache/${ii}.jpg`)
        }
    } catch (e) {
        console.log(e)
        return api.sendMessage('Error', event.threadID, event.messageID)
    }
};