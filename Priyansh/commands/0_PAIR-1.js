const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.2.8",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Fixed canvas scaling and positioning",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cachePath = path.join(__dirname, 'cache', `pair_${senderID}.png`);

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const allParticipants = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());

        if (allParticipants.length === 0) return api.sendMessage("Is group mein koi aur nahi hai!", threadID, messageID);

        const randomID = allParticipants[Math.floor(Math.random() * allParticipants.length)];
        const senderData = await Users.getData(senderID) || {};
        const matchData = await Users.getData(randomID) || {};
        
        // Background and Avatar URLs
        const bgUrl = "https://i.imgur.com/PnN4B93.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarUrl2 = `https://graph.facebook.com/${randomID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        const getImg = async (url) => {
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            return await loadImage(Buffer.from(res.data));
        };

        const [bg, avt1, avt2] = await Promise.all([getImg(bgUrl), getImg(avatarUrl1), getImg(avatarUrl2)]);

        // FIXED: Explicit Canvas Size to match the template (720x480 is standard for this frame)
        const canvas = createCanvas(720, 480);
        const ctx = canvas.getContext('2d');

        // Draw Background stretched to canvas size
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // Helper to draw perfectly centered circular avatars
        const drawAvatar = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            // Scaling image to fit the circle perfectly
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
            
            // Outer white glow/border
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 5;
            ctx.stroke();
        };

        // COORDINATES FIX: Based on 720x480 resolution
        // Left Circle: x=185, y=245 | Right Circle: x=535, y=245
        drawAvatar(avt1, 185, 245, 115); 
        drawAvatar(avt2, 535, 245, 115); 

        fs.writeFileSync(cachePath, canvas.toBuffer());

        const msg = {
            body: `💞 *Haseen Jodi Mil Gayi Hai!* 💞\n\n👤 ${senderData.name || "User"} ❤️ ${matchData.name || "Partner"}\n\n✨ Mubarak Ho! ✨`,
            attachment: fs.createReadStream(cachePath)
        };

        return api.sendMessage(msg, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
        return api.sendMessage(`Error: ${e.message}`, threadID, messageID);
    }
};
