const dipto = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

// Cache फ़ाइल का पथ जहाँ 'on'/'off' स्थिति संग्रहीत है
const pathFile = __dirname + '/cache/d1p.txt';

// सुनिश्चित करें कि cache फ़ाइल मौजूद है
if (!fs.existsSync(path.dirname(pathFile))) {
    fs.mkdirSync(path.dirname(pathFile));
}
if (!fs.existsSync(pathFile)) {
    fs.writeFileSync(pathFile, 'true');
}

const isEnable = fs.readFileSync(pathFile, 'utf-8').trim();

module.exports.config = {
    name: "prefix",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SHAAN (Fixed by Gemini)",
    description: "Displays bot prefix/guide and allows toggling the no-prefix trigger.",
    commandCategory: "system",
    usages: "[on/off]",
    cooldowns: 5,
};

module.exports.handleEvent = async ({ api, event, global, client }) => {
    // global और client ऑब्जेक्ट को handleEvent के arguments में पास किया जाता है
    if (isEnable === "true") {
        const dipto2 = event.body ? event.body.toLowerCase() : '';

        // 𝐒𝐇𝐀𝐀𝐍 𝐁𝐎𝐓 ====="
        if (dipto2.indexOf("prefix") === 0) {
            
            let d1PInfo;
            try {
                d1PInfo = await api.getThreadInfo(event.threadID);
            } catch (e) {
                console.error("Error fetching thread info:", e);
                return; // त्रुटि होने पर रुकें
            }
            
            let diptoName = d1PInfo.threadName || "Unknown Group";
            var time = moment.tz("Asia/Karachi").format("LLLL");
            
            // client.commands.size को सुरक्षित रूप से उपयोग करें
            const commandSize = client && client.commands ? client.commands.size : 'N/A';

            const text = 
`—»✨[ 𝐏𝐫𝐞𝐟𝐢𝐱 𝐄𝐯𝐞𝐧𝐭 ]✨«—
𝐍𝐀𝐌𝐄➢𝐁𝐎𝐓 𝐉𝐀𝐍𝐔 
𝐑𝐎𝐁𝐎𝐓 𝐏𝐑𝐄𝐅𝐈𝐗 ➢ ｢ ${global.config.PREFIX || 'Default'} ｣
𝐑𝐎𝐁𝐎𝐓 𝐂𝐌𝐃➢ ｢ ${commandSize} ｣
𝐓𝐈𝐌𝐄 ➢${time}
𝐆𝐑𝐎𝐔𝐏 𝐍𝐀𝐌𝐄
${diptoName}
𝐎𝐖𝐍𝐄𝐑➢ 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗
𝐂𝐫𝐞𝐚𝐭𝐨𝐫 ━➢ 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗`

            const imgur = ["https://i.imgur.com/P0VqFW2.jpeg"];
            const link = imgur[Math.floor(Math.random() * imgur.length)];

            let filename;
            try {
                const res = await dipto.get(link, { responseType: 'arraybuffer' });
                const ex = path.extname(link);
                filename = __dirname + `/cache/Shaon${ex}`;
                fs.writeFileSync(filename, Buffer.from(res.data, 'binary'));
            } catch (e) {
                console.error("Error downloading image:", e);
                // यदि छवि डाउनलोड विफल हो जाती है, तो केवल टेक्स्ट संदेश भेजें
                api.sendMessage({ body: text }, event.threadID, event.messageID);
                return;
            }


            api.sendMessage(
                {
                    body: `${text}`,
                    attachment: fs.createReadStream(filename)
                }, 
                event.threadID, 
                () => {
                    if (fs.existsSync(filename)) {
                        fs.unlinkSync(filename); // सफलतापूर्वक भेजने के बाद छवि हटा दें
                    }
                }, 
                event.messageID
            );
        }
    }
}

module.exports.run = async ({ api, args, event }) => {
    // यहाँ this.config.name के बजाय module.exports.config.name का उपयोग करें
    const commandName = module.exports.config.name; 
    
    try {
        if (args[0] && args[0].toLowerCase() === 'on') {
            fs.writeFileSync(pathFile, 'true');
            api.sendMessage('No-prefix trigger successfully **enabled**.', event.threadID, event.messageID);
        }
        else if (args[0] && args[0].toLowerCase() === 'off') {
            fs.writeFileSync(pathFile, 'false');
            api.sendMessage('No-prefix trigger successfully **disabled**.', event.threadID, event.messageID);
        }
        else {
            api.sendMessage(`गलत फ़ॉर्मेट! सही उपयोग है: **${commandName} on** या **${commandName} off**`, event.threadID, event.messageID);
        }
    }
    catch(e) {
        console.error("Error in prefix.run:", e);
        api.sendMessage('कमांड चलाते समय एक त्रुटि हुई। कृपया कंसोल देखें।', event.threadID, event.messageID);
    }
}
