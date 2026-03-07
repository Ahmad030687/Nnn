const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "2.5.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Strict opposite gender match with fixed canvas coordinates",
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
        
        // Gender: 1 (Female), 2 (Male)
        const senderGender = senderInfo[senderID].gender;
        const senderName = senderInfo[senderID].name;

        // --- Gender Filter Logic ---
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

        // Backup plan agar opposite gender na mile
        if (list.length === 0) {
            const otherMembers = allParticipants.filter(id => id != senderID && id != api.getCurrentUserID());
            if (otherMembers.length === 0) return api.sendMessage("Group mein koi aur member nahi mila!", threadID, messageID);
            
            const randomID = otherMembers[Math.floor(Math.random() * otherMembers.length)];
            const info = await api.getUserInfo(randomID);
            list.push({ id: randomID, name: info[randomID].name });
        }

        const match = list[Math.floor(Math.random() * list.length)];
        const matchPercentage = Math.floor(Math.random() * 31) + 70;

        // Poetry Collection
        const poetry = [
            "Hazaaron mein chunna hai tumhein,\nTum mere hone ka maan rakhna! ❤️",
            "Suno! tumhara milna naseeb ki baat thi,\nAur tumhara mil jana zindagi ki! ✨",
            "Mohabbat ke bazar mein bheed bohot hai,\nLekin mera sukoon sirf tum ho! 🌹",
            "Rab ne banadi ye jodi kamaal hai,\nEk phool hai toh doosra bemisaal hai! 🌸",
            "Tumhara naam aur mera naam saath kitna jachta hai,\nJaise koi purana rishta aaj phir se nikharta hai! ✨"
        ];
        const randomPoetry = poetry[Math.floor(Math.random() * poetry.length)];

        // --- Canvas Section (FIXED) ---
        const bgUrl = "https://i.imgur.com/fP8th1j.jpeg"; 
        const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${token}`;
        const avatarUrl2 = `https://graph.facebook.com/${match.id}/picture?width=512&height=512&access_token=${token}`;

        const [bg, avatar1, avatar2] = await Promise.all([
            loadImage(bgUrl),
            loadImage(avatarUrl1).catch(() => loadImage('https://i.imgur.com/6ve982S.png')),
            loadImage(avatarUrl2).catch(() => loadImage('https://i.imgur.com/6ve982S.png'))
        ]);

        // Background size (720x480) ke mutabiq canvas create kiya
        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // Circular Avatar Drawing Function
        const drawCircleAvatar = (img, centerX, centerY, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            // Centering logic: (Center point - Radius)
            ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
            ctx.restore();
        };

        /**
         * FIXED COORDINATES FOR 720x480 IMAGE:
         * Left Circle Center: X=185, Y=235
         * Right Circle Center: X=535, Y=235
         * Radius: 95
         */
        drawCircleAvatar(avatar1, 185, 235, 95); 
        drawCircleAvatar(avatar2, 535, 235, 95); 

        // Cache file save karein
        const buffer = canvas.toBuffer();
        fs.writeFileSync(cachePath, buffer);

        const msg = `💕 **Best Match Found!** 💕\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `👤 **Aap:** ${senderName}\n` +
                    `👤 **Partner:** ${match.name}\n` +
                    `💓 **Compatibility:** ${matchPercentage}%\n\n` +
                    `📖 **Shayari:**\n_${randomPoetry}_\n\n` +
                    `✨ Yeh jodi naseeb se milti hai! ✨\n` +
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
        return api.sendMessage("❌ Error: Kuch masla pesh aaya. Dobara koshish karein.", threadID, messageID);
    }
};
