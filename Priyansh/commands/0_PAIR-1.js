const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.3.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Perfectly Aligned Pair Frame",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 10
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cachePath = path.join(__dirname, 'cache', `perfect_pair_${senderID}.png`);

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const allParticipants = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());

        if (allParticipants.length === 0) return api.sendMessage("Group mein koi aur nahi hai!", threadID, messageID);

        const randomID = allParticipants[Math.floor(Math.random() * allParticipants.length)];
        
        // URLs
        const bgUrl = "https://i.imgur.com/PnN4B93.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarUrl2 = `https://graph.facebook.com/${randomID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        async function getImg(url) {
            const res = await axios.get(url, { 
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            return await loadImage(Buffer.from(res.data));
        }

        const [bg, avt1, avt2] = await Promise.all([getImg(bgUrl), getImg(avatarUrl1), getImg(avatarUrl2)]);

        // 720x480 resolution setup
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
            // Rings ke sath match karne ke liye white stroke
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        // --- PERFECT POSITIONING ---
        // Left Circle (Thoda upar aur left hai)
        drawAvatar(avt1, 230, 195, 112); 
        
        // Right Circle (Thoda upar aur right hai)
        drawAvatar(avt2, 735, 195, 112); 
        // Note: Frame design ke mutabiq 2nd avatar right side wala circle hai.
        // Agar image cut rahi ho toh x value ko 500-550 ke beech adjust karein.

        // Fix for 720x480 specifically for your image:
        // Left: x=235, y=210, r=105
        // Right: x=485, y=210, r=105
        
        // Re-aligning based on your specific template:
        ctx.clearRect(0,0,720,480); // Resetting for clean draw
        ctx.drawImage(bg, 0, 0, 720, 480);
        drawAvatar(avt1, 258, 245, 108); // Left center
        drawAvatar(avt2, 742, 245, 108); // Right center - Adjusted for your frame's width

        fs.writeFileSync(cachePath, canvas.toBuffer());

        api.sendMessage({
            body: "💞 Ab check karein, perfect jodi! 💞",
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => { if(fs.existsSync(cachePath)) fs.unlinkSync(cachePath) }, messageID);

    } catch (e) {
        api.sendMessage(`Error: ${e.message}`, threadID, messageID);
    }
};
