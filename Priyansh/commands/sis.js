const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
    name: "sis",
    version: "11.5.0",
    hasPermssion: 0,
    credits: "Ahmad RDX",
    description: "Bhai Behen Special Bond Frame - 100% Perfect Fit",
    commandCategory: "png",
    usages: "[@mention]",
    cooldowns: 5,
    dependencies: { "axios": "", "fs-extra": "", "path": "", "jimp": "" }
};

async function circle(image) {
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
}

module.exports.run = async function ({ event, api, args }) {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions);
    
    if (!mention[0]) return api.sendMessage("❌ Pehle apni behen ko tag karein Ahmad bhai! 🌸", threadID, messageID);

    const one = senderID, two = mention[0];
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const outputPath = path.join(cacheDir, `sis_final_${Date.now()}.png`);
    const framePath = path.join(__dirname, "cache", "canvas", "special_bond.png"); 

    if (!fs.existsSync(framePath)) {
        return api.sendMessage("❌ Frame (special_bond.png) nahi mila! 'cache/canvas' folder check karein.", threadID, messageID);
    }

    try {
        api.sendMessage("🎨 Final touch-up ho raha hai, bas thora sa sabar...", threadID, messageID);

        const [res1, res2] = await Promise.all([
            axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' }),
            axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })
        ]);

        const frame = await jimp.read(framePath);
        const avt1 = await jimp.read(await circle(Buffer.from(res1.data)));
        const avt2 = await jimp.read(await circle(Buffer.from(res2.data)));

        frame.resize(1024, 1024);
        
        const avatarSize = 318; 
        
        // 🎯 AHMAD RDX - FINAL CALIBRATION
        // Left move karne ke liye X kam kiya (168 -> 160)
        // Up move karne ke liye Y kam kiya (375 -> 367)
        frame.composite(avt1.resize(avatarSize, avatarSize), 160, 367)
             .composite(avt2.resize(avatarSize, avatarSize), 572, 367);

        await frame.writeAsync(outputPath);

        return api.sendMessage({
            body: "✧•❁ 𝐓𝐡𝐞 𝐒𝐩𝐞𝐜𝐢𝐚𝐥 𝐁𝐨𝐧𝐝 ❁•✧\n━━━━━━━━━━━━━━━━━\n\n     👑 𝐌𝐢𝐥 𝐆𝐚𝐲𝐢 ❤\n\n𝐓𝐞𝐫𝐢 𝐒𝐢𝐬𝐭𝐞𝐫 🩷\n\n━━━━━━━━━━━━━━━━━",
            attachment: fs.createReadStream(outputPath)
        }, threadID, () => {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Error: Frame processing mein masla aa gaya.", threadID, messageID);
    }
};
