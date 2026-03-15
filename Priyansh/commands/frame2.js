const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
    name: "frame",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "Mention user ya reply par profile picture frame mein lagayein",
    commandCategory: "utility",
    usages: "[mention/reply]",
    cooldowns: 5
};

module.exports.run = async function ({ event, api, args }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;
    const cacheDir = path.join(__dirname, "cache", "canvas");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let targetID;

    // 1. Target ID Identify Karna
    if (event.type == "message_reply") {
        targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else {
        targetID = senderID; // Agar kuch nahi hai toh apni DP par frame lagega
    }

    try {
        api.setMessageReaction("🎨", messageID, () => {}, true);

        // Files Path
        const framePath = path.join(cacheDir, "frame.png");
        const avatarPath = path.join(cacheDir, `avt_${targetID}.png`);
        const outputPath = path.join(cacheDir, `out_${targetID}.png`);

        // Frame Image (Maine aik golden frame link dala hai, aap change kar sakte hain)
        const frameURL = "https://i.imgur.com/a4ddL9o.jpg"; 
        
        // Profile Picture URL
        const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        // Download Images
        const [frameData, avatarData] = await Promise.all([
            axios.get(frameURL, { responseType: 'arraybuffer' }),
            axios.get(avatarURL, { responseType: 'arraybuffer' })
        ]);

        fs.writeFileSync(framePath, Buffer.from(frameData.data));
        fs.writeFileSync(avatarPath, Buffer.from(avatarData.data));

        // Jimp Processing
        const frameImg = await jimp.read(framePath);
        const avatarImg = await jimp.read(avatarPath);

        // Profile pic ko circle banana (Optionally)
        avatarImg.circle();

        // Resize frame to match avatar or vice versa
        // Default 500x500 standard hai
        avatarImg.resize(500, 500);
        frameImg.resize(500, 500);

        // Frame ko Profile pic ke upar lagana (Composite)
        avatarImg.composite(frameImg, 0, 0);

        await avatarImg.writeAsync(outputPath);

        // Bhejna aur Files delete karna
        return api.sendMessage({
            body: "✨ Aapka Profile Frame Tayyar Hai! ✨",
            attachment: fs.createReadStream(outputPath)
        }, threadID, () => {
            fs.unlinkSync(avatarPath);
            fs.unlinkSync(outputPath);
            if (fs.existsSync(framePath)) fs.unlinkSync(framePath);
        }, messageID);

    } catch (e) {
        console.error(e);
        return api.sendMessage("❌ Error: Profile picture nikalne mein masla ho raha hai ya API down hai.", threadID, messageID);
    }
};
