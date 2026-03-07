const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "2.9.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Urdu system with perfect pairing percentage",
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

        // Agar opposite gender na mile to kisi bhi member ko utha lo
        if (list.length === 0) {
            const otherMembers = allParticipants.filter(id => id != senderID && id != api.getCurrentUserID());
            if (otherMembers.length === 0) return api.sendMessage("Is group mein koi aur member nahi mila!", threadID, messageID);
            const randomID = otherMembers[Math.floor(Math.random() * otherMembers.length)];
            const info = await api.getUserInfo(randomID);
            list.push({ id: randomID, name: info[randomID].name });
        }

        const match = list[Math.floor(Math.random() * list.length)];
        const matchPercentage = Math.floor(Math.random() * 51) + 50; // 50% se 100% ke darmiyan

        // Image template aur Avatars
        const bgUrl = "https://i.imgur.com/fP8th1j.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
        const avatarUrl2 = `https://graph.facebook.com/${match.id}/picture?width=512&height=512`;

        const [bg, avatar1, avatar2] = await Promise.all([
            loadImage(bgUrl),
            loadImage(avatarUrl1).catch(() => loadImage('https://i.imgur.com/6ve982S.png')),
            loadImage(avatarUrl2).catch(() => loadImage('https://i.imgur.com/6ve982S.png'))
        ]);

        // Canvas 720x480 fix
        const canvas = createCanvas(720, 480);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bg, 0, 0, 720, 480);

        const drawCircle = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
        };

        // Exact Coordinates (Left: 184, Right: 536)
        drawCircle(avatar1, 184, 236, 96); 
        drawCircle(avatar2, 536, 236, 96); 

        const buffer = canvas.toBuffer();
        fs.writeFileSync(cachePath, buffer);

        // Urdu/Roman Message System
        const msg = `🌹 **Aapki Jodi Mil Gayi Hai!** 🌹\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `👤 **Aap:** ${senderName}\n` +
                    `👤 **Aapka Partner:** ${match.name}\n\n` +
                    `💓 **Pairing Compatibility:** ${matchPercentage}%\n` +
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
