const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "idit",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "Hugging Face Pro Image Editing (Nano Banana Style)",
    commandCategory: "AI",
    usages: "[Reply to image] [Prompt]",
    cooldowns: 15
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const hfToken = "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"; // Aapka Access Token

    // 1. Image Check
    if (event.type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ Jani, kisi photo par reply kar ke prompt likho!", threadID, messageID);
    }

    const userPrompt = args.join(" ");
    if (!userPrompt) return api.sendMessage("❌ Saath mein prompt likho ke kya tabdeeli karni hai!", threadID, messageID);

    try {
        api.setMessageReaction("⏳", messageID, () => {}, true);
        api.sendMessage("🚀 Hugging Face servers se connect ho raha hai... Thora sabar karein (Nano Banana is processing).", threadID);

        const imageUrl = messageReply.attachments[0].url;
        const cachePath = path.join(__dirname, "cache", `hf_edit_${Date.now()}.png`);

        // Image ko download karke buffer mein lena (Hugging Face image buffer leta hai)
        const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imgBuffer = Buffer.from(imgResponse.data, 'binary');

        // --- Hugging Face Model Selection ---
        // Hum "runwayml/stable-diffusion-v1-5" ya "stabilityai/stable-diffusion-xl-base-1.0" use kar sakte hain
        // Image-to-image ke liye ye model zabardast hai
        const modelUrl = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";

        const res = await axios({
            url: modelUrl,
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${hfToken}`,
                "Content-Type": "application/json"
            },
            data: {
                inputs: userPrompt,
                image: imgBuffer.toString('base64'), // Base64 encoding for Img2Img
                parameters: {
                    negative_prompt: "blurry, distorted, low quality, bad anatomy",
                    strength: 0.6, // 0.6 matlab image ko 60% badlo aur 40% purani pehchan rakho
                    guidance_scale: 7.5
                }
            },
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(cachePath, Buffer.from(res.data));

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage({
            body: "✨ Nano Banana Style Edit Tayyar Hai! ✨",
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
        console.error(e);
        let errorMsg = "❌ Hugging Face Error: Model load ho raha hai ya API limit ka masla hai.";
        if (e.response && e.response.status === 503) errorMsg = "⏳ Model abhi so raha hai (Loading), 1 minute baad dobara try karein!";
        
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(errorMsg, threadID, messageID);
    }
};

