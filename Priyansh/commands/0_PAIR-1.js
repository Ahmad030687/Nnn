const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.2.7",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Random pair with fixed canvas positioning",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, 'cache');
    const cachePath = path.join(cacheDir, `pair_${senderID}_${Date.now()}.png`);

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const allParticipants = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());

        if (allParticipants.length === 0) {
            return api.sendMessage("Is group mein aapke ilawa koi aur nahi hai!", threadID, messageID);
        }

        const randomID = allParticipants[Math.floor(Math.random() * allParticipants.length)];

        const senderData = await Users.getData(senderID) || {};
        const matchData = await Users.getData(randomID) || {};
        const senderName = senderData.name || "User";
        const matchName = matchData.name || "Partner";

        const matchPercentage = Math.floor(Math.random() * 41) + 60;
        const poetryList = [
            "Hazaaron mein chuna hai aapko,\nBas ab hamesha saath rehna.. ✨",
            "Suno! tum mere liye wahi ho,\nJo ek pyaasi zameen ke liye barish.. 🌧️",
            "Kitna haseen hota hai woh lamha,\nJab do ajnabi ek pyaari jodi ban jate hain.. ❤️",
            "Mili hai aaj humein woh jodi,\nJis ki misaal saari mehfil degi.. 🌹"
        ];
        const randomPoetry = poetryList[Math.floor(Math.random() * poetryList.length)];

        // FIXED: New Background URL & Better Avatar URLs
        const bgUrl = "https://i.imgur.com/PnN4B93.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarUrl2 = `https://graph.facebook.com/${randomID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        async function getImg(url) {
            try {
                // Added headers to mimic a browser to avoid getting blocked (Black Image fix)
                const res = await axios.get(url, { 
                    responseType: 'arraybuffer', 
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                return await loadImage(Buffer.from(res.data));
            } catch (e) {
                console.log(`Error loading image: ${url}`);
                // Fallback to a default profile icon if FB fails
                return await loadImage('https://i.imgur.com/6ve982S.png'); 
            }
        }

        const [bg, avatar1, avatar2] = await Promise.all([
            getImg(bgUrl),
            getImg(avatarUrl1),
            getImg(avatarUrl2)
        ]);

        // Creating Canvas
        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        const drawAvatar = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();

            // White Border
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 8;
            ctx.stroke();
        };

        // Positions adjusted for the new background image
        drawAvatar(avatar1, 164, 225, 110); 
        drawAvatar(avatar2, 556, 226, 111); 

        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(cachePath, canvas.toBuffer());

        const msg = {
            body: `💞 Haseen Jodi Mil Gayi Hai! 💞\n━━━━━━━━━━━━━━━━━━\n\n👤 Aap: ${senderName}\n👤 Partner: ${matchName}\n\n📝 Shayari:\n${randomPoetry}\n\n💓 Compatibility: ${matchPercentage}%\n\n✨ Mubarak Ho! ✨`,
            attachment: fs.createReadStream(cachePath)
        };

        return api.sendMessage(msg, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (err) {
        console.error("PAIR ERROR:", err);
        return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
};