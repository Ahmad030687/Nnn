const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Urdu pairing system with perfect image alignment",
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
        
        const senderGender = senderInfo[senderID].gender;
        const senderName = senderInfo[senderID].name;
        const targetGender = (senderGender === 2) ? 1 : 2;
        
        let list = [];
        const allParticipants = threadInfo.participantIDs;

        for (const id of allParticipants) {
            if (id == senderID || id == api.getCurrentUserID()) continue;
            const info = await api.getUserInfo(id);
            if (info[id].gender === targetGender) {
                list.push({ id, name: info[id].name });
            }
        }

        if (list.length === 0) {
            const otherMembers = allParticipants.filter(id => id != senderID && id != api.getCurrentUserID());
            if (otherMembers.length === 0) return api.sendMessage("Is group mein koi aur member nahi mila!", threadID, messageID);
            const randomID = otherMembers[Math.floor(Math.random() * otherMembers.length)];
            const info = await api.getUserInfo(randomID);
            list.push({ id: randomID, name: info[randomID].name });
        }

        const match = list[Math.floor(Math.random() * list.length)];
        const matchPercentage = Math.floor(Math.random() * 41) + 60; // 60% to 100%

        // New Imgur Link for your template
        const bgUrl = "https://i.imgur.com/W2O3Bsm.png"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
        const avatarUrl2 = `https://graph.facebook.com/${match.id}/picture?width=512&height=512`;

        const [bg, avatar1, avatar2] = await Promise.all([
            loadImage(bgUrl),
            loadImage(avatarUrl1).catch(() => loadImage('https://i.imgur.com/6ve982S.png')),
            loadImage(avatarUrl2).catch(() => loadImage('https://i.imgur.com/6ve982S.png'))
        ]);

        // Original Template Size: 736x464 (Based on the uploaded image aspect)
        const canvas = createCanvas(736, 464);
        const ctx = canvas.getContext('2d');
        
        // Background draw karein
        ctx.drawImage(bg, 0, 0, 736, 464);

        /**
         * Circle Draw Function
         * @param {Image} img - User Profile Picture
         * @param {Number} x - Center X coordinate
         * @param {Number} y - Center Y coordinate
         * @param {Number} radius - Circle size
         */
        const drawAvatar = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
        };

        // Coordinates adjusted for your specific frame
        // Left Circle: X=215, Y=228 | Right Circle: X=521, Y=228
        drawAvatar(avatar1, 215, 228, 115); 
        drawAvatar(avatar2, 521, 228, 115); 

        const buffer = canvas.toBuffer();
        fs.writeFileSync(cachePath, buffer);

        const msg = `🌹 **Aapki Jodi Mil Gayi Hai!** 🌹\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `👤 **Aap:** ${senderName}\n` +
                    `👤 **Aapka Partner:** ${match.name}\n\n` +
                    `💓 **Compatibility:** ${matchPercentage}%\n` +
                    `✨ **Mubarak Ho! Yeh jodi bohot pyari hai.** ✨\n\n` +
                    `Credits: Shaan Khan`;

        return api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(cachePath),
            mentions: [{ tag: senderName, id: senderID }, { tag: match.name, id: match.id }]
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Maazrat! Image banane mein masla hua.", threadID, messageID);
    }
};
