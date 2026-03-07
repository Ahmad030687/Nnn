const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.2.3",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Random pair with beautiful Urdu poetry",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cachePath = path.join(__dirname, 'cache', `pair_${senderID}.png`);

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const senderInfo = await api.getUserInfo(senderID);
        const senderName = senderInfo[senderID].name;
        
        const allParticipants = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());
        
        if (allParticipants.length === 0) {
            return api.sendMessage("Is group mein aapke ilawa koi aur nahi hai!", threadID, messageID);
        }

        const randomID = allParticipants[Math.floor(Math.random() * allParticipants.length)];
        const matchInfo = await api.getUserInfo(randomID);
        const matchName = matchInfo[randomID].name;

        const matchPercentage = Math.floor(Math.random() * 41) + 60;

        const poetryList = [
            "Hazaaron mein chuna hai aapko,\nBas ab hamesha saath rehna.. ✨",
            "Suno! tum mere liye wahi ho,\nJo ek pyaasi zameen ke liye barish.. 🌧️",
            "Kitna haseen hota hai woh lamha,\nJab do ajnabi ek pyaari jodi ban jate hain.. ❤️",
            "Mili hai aaj humein woh jodi,\nJis ki misaal saari mehfil degi.. 🌹",
            "Log kehte hain jodiyaan upar se banti hain,\nLagta hai humne aaj zameen par hi milwa di.. ✨",
            "Ek naam tera, ek naam mera..\nBas yuhi rahe ye saath silsila tera mera.. ❤️"
        ];
        const randomPoetry = poetryList[Math.floor(Math.random() * poetryList.length)];

        const bgUrl = "https://i.imgur.com/fP8th1j.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarUrl2 = `https://graph.facebook.com/${randomID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        async function getImg(url) {
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            return await loadImage(Buffer.from(res.data, 'utf-8'));
        }

        const [bg, avatar1, avatar2] = await Promise.all([
            loadImage(bgUrl),
            getImg(avatarUrl1).catch(() => loadImage('https://i.imgur.com/6ve982S.png')),
            getImg(avatarUrl2).catch(() => loadImage('https://i.imgur.com/6ve982S.png'))
        ]);

        const canvas = createCanvas(735, 480);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bg, 0, 0, 735, 480);

        const drawAvatar = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
        };

        // Profile pictures adjustment
        drawAvatar(avatar1, 230, 233, 125); 
        drawAvatar(avatar2, 530, 233, 125); 

        fs.writeFileSync(cachePath, canvas.toBuffer());

        // Text message without ** symbols
        const msg = `💞 Haseen Jodi Mil Gayi Hai! 💞\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `👤 Aap: ${senderName}\n` +
                    `👤 Aapka Partner: ${matchName}\n\n` +
                    `📝 Shayari:\n"${randomPoetry}"\n\n` +
                    `💓 Compatibility: ${matchPercentage}%\n\n` +
                    `✨ Mubarak Ho! Yeh jodi bohot pyari hai. ✨`;

        return api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Error: Profile images load nahi ho sakein.", threadID, messageID);
    }
};
