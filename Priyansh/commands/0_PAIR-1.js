const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.2.9",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Fixed 429 Error and Positioning",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 15 // Cooldown badha diya taaki spam na ho
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, 'cache');
    const cachePath = path.join(cacheDir, `pair_${senderID}.png`);

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const allParticipants = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());

        if (allParticipants.length === 0) return api.sendMessage("Group mein koi aur nahi hai!", threadID, messageID);

        const randomID = allParticipants[Math.floor(Math.random() * allParticipants.length)];
        
        // URLs
        const bgUrl = "https://i.imgur.com/PnN4B93.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarUrl2 = `https://graph.facebook.com/${randomID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        // FIXED Fetch Function with Headers to avoid 429/Block
        async function getImg(url) {
            try {
                const res = await axios.get(url, { 
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                return await loadImage(Buffer.from(res.data));
            } catch (err) {
                console.log("Image Load Failed, Using Placeholder.");
                return await loadImage('https://i.imgur.com/6ve982S.png'); // Fallback image
            }
        }

        const [bg, avt1, avt2] = await Promise.all([getImg(bgUrl), getImg(avatarUrl1), getImg(avatarUrl2)]);

        const canvas = createCanvas(720, 480);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bg, 0, 0, 720, 480);

        const drawAvatar = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.stroke();
        };

        // Positions optimized for 720x480
        drawAvatar(avt1, 185, 245, 110); 
        drawAvatar(avt2, 535, 245, 110); 

        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        fs.writeFileSync(cachePath, canvas.toBuffer());

        api.sendMessage({
            body: "💞 Mubarak Ho! New Jodi Mil Gayi!",
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
        api.sendMessage(`Server busy hai, thodi der baad try karein.`, threadID, messageID);
    }
};
