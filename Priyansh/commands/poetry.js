const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

// Render par FFmpeg install nahi hota, isliye static path set karna zaroori hai
ffmpeg.setFfmpegPath(ffmpegStatic);

module.exports.config = {
    name: "poetry",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Ahmad RDX",
    description: "Sabse tez green screen poetry overlay command",
    commandCategory: "fun",
    usages: "[v1/v2]",
    cooldowns: 10,
    usePrefix: true,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "fluent-ffmpeg": "",
        "ffmpeg-static": ""
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const reply = (msg) => api.sendMessage(msg, threadID, messageID);

    // 1. Photo Check
    if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return reply("❌ Ahmad bhai, pehle kisi Photo ka reply karein is command ke sath!");
    }

    // 2. Category (v1/v2) Logic
    const version = (args[0] || "v1").toLowerCase();
    if (!["v1", "v2"].includes(version)) return reply("❌ Sirf v1 (Sad) ya v2 (Attitude) use karein.");

    const cacheDir = path.join(__dirname, "cache");
    const videoDir = path.join(cacheDir, "poetry_videos", version);
    const tempDir = path.join(cacheDir, "poetry_temp");

    // Folders check/create
    fs.ensureDirSync(videoDir);
    fs.ensureDirSync(tempDir);

    let videos = [];
    try {
        videos = fs.readdirSync(videoDir).filter(f => f.endsWith(".mp4"));
    } catch (e) { return reply("❌ Video folders (v1/v2) nahi mile!"); }

    if (videos.length === 0) return reply(`❌ Folder '${version}' mein kam az kam ek .mp4 video hona zaroori hai!`);

    // Processing Message
    const infoMsg = await new Promise(resolve => {
        api.sendMessage("⚡ RDX Turbo Engine: Processing... (5-10s)", threadID, (err, info) => resolve(info), messageID);
    });

    try {
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        const videoPath = path.join(videoDir, randomVideo);
        const imageUrl = messageReply.attachments[0].url;

        const ts = Date.now();
        const tempImg = path.join(tempDir, `img_${ts}.jpg`);
        const outVideo = path.join(tempDir, `out_${ts}.mp4`);

        // Image Download
        const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempImg, imgRes.data);

        // --- EXTREME SPEED FFMPEG ENGINE ---
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(tempImg)
                .loop(1)
                .input(videoPath)
                .complexFilter([
                    // Sabse tez resolution (640x360) jo status ke liye perfect hai
                    "[0:v]scale=640:360,setsar=1[bg]",
                    "[1:v]scale=640:360,setsar=1,format=rgba,chromakey=0x00FF00:0.15:0.1[fg]",
                    "[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
                ])
                .outputOptions([
                    "-map [outv]",
                    "-map 1:a?",         // Video ki original audio
                    "-c:v libx264",
                    "-preset ultrafast", // SABSE TEZ PROCESSING
                    "-crf 30",           // Optimized quality vs speed
                    "-pix_fmt yuv420p",
                    "-c:a aac",
                    "-b:a 64k",          // Audio bitrate kam (speed ke liye)
                    "-shortest",         // Video khatam hotay hi stop
                    "-t 12",             // Video ko 12 seconds par lock kar diya (Fastest)
                    "-movflags +faststart"
                ])
                .on("error", (err) => reject(err))
                .on("end", resolve)
                .save(outVideo);
        });

        // Video Send Karna
        api.sendMessage({
            body: `✅ Edited by RDX Speed Engine\n🎥 File: ${randomVideo}`,
            attachment: fs.createReadStream(outVideo)
        }, threadID, () => {
            // Cleanup: Files delete karein taake Render ki memory full na ho
            if (fs.existsSync(tempImg)) fs.unlinkSync(tempImg);
            if (fs.existsSync(outVideo)) fs.unlinkSync(outVideo);
            api.unsendMessage(infoMsg.messageID); // Processing message hatayen
        }, messageID);

    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
        api.unsendMessage(infoMsg.messageID);
    }
};
