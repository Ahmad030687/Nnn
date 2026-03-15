const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "adit",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "Image ko prompt ke mutabiq edit karein (Img2Img)",
    commandCategory: "AI",
    usages: "[Reply to image] [Prompt]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    // 1. Check if user replied to an image
    if (event.type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ Oye! Kisi photo par reply kar ke batao kya edit karna hai!", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("❌ Saath mein prompt bhi likho (e.g: .edit change background to mars)", threadID, messageID);

    try {
        api.setMessageReaction("⏳", messageID, () => {}, true);
        api.sendMessage("🎨 Edit ho rahi hai, thora sabar karo jani...", threadID);

        const imageUrl = encodeURIComponent(messageReply.attachments[0].url);
        
        // --- Hugging Face / Pollinations Free AI Interface ---
        // Hum yahan aik free API use kar rahe hain jo image + prompt ko process karti hai
        const editApiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?ref=${imageUrl}&width=512&height=512&nologo=true`;

        const cachePath = path.join(__dirname, "cache", `edit_${Date.now()}.png`);
        
        const response = await axios({
            url: editApiUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(cachePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage({
                body: "✨ Lo jani, edit ho gayi! ✨",
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => fs.unlinkSync(cachePath), messageID);
        });

        writer.on('error', (err) => {
            throw err;
        });

    } catch (e) {
        console.error(e);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ AI server busy hai ya link invalid hai. Dobara try karna!", threadID, messageID);
    }
};

