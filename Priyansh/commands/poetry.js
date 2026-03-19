const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

// Use static ffmpeg binary (Bypasses the need to install ffmpeg on Render)
ffmpeg.setFfmpegPath(ffmpegStatic);

module.exports.config = {
    name: "poetry",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Ahmad RDX",
    description: "Remove green background from video & overlay on replied image",
    commandCategory: "fun",
    usages: "[v1/v2]",
    cooldowns: 25,
    usePrefix: true,
    dependencies: {
        "axios": "^1.6.0",
        "fs-extra": "^11.2.0",
        "fluent-ffmpeg": "^2.1.3",
        "ffmpeg-static": "^5.2.0"
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    // Helper function for quick replies
    const reply = (msg) => api.sendMessage(msg, threadID, messageID);

    // Check if user replied to an image
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0 || messageReply.attachments[0].type !== "photo") {
        return reply("❌ Pehle kisi **Photo** ka reply karein is command ke sath:\n• poetry\n• poetry v2");
    }

    const version = (args[0] || "v1").toLowerCase();
    if (!["v1", "v2"].includes(version)) {
        return reply("❌ Sirf v1 ya v2 allowed hai.\nExample: !poetry v2");
    }

    // Set Cache Directories
    const cacheDir = path.join(__dirname, "cache");
    const videoDir = path.join(cacheDir, "poetry_videos", version);
    const tempDir = path.join(cacheDir, "poetry_temp");

    // Ensure directories exist
    fs.ensureDirSync(cacheDir);
    fs.ensureDirSync(videoDir);
    fs.ensureDirSync(tempDir);

    let videos = [];
    try {
        videos = fs.readdirSync(videoDir).filter(f => f.toLowerCase().endsWith(".mp4"));
    } catch (err) {
        return reply(`❌ Folder error: cache/poetry_videos/${version} check karein.`);
    }

    if (videos.length === 0) {
        return reply(`❌ File nahi mili! Kripya is folder mein .mp4 videos dalein:\nPriyansh/commands/cache/poetry_videos/${version}`);
    }

    reply("⏳ Editing shuru ho gayi hai... (20 se 60 seconds lag sakte hain)");

    try {
        const randomFile = videos[Math.floor(Math.random() * videos.length)];
        const videoPath = path.join(videoDir, randomFile);
        const imageUrl = messageReply.attachments[0].url;

        const ts = Date.now();
        const tempImg = path.join(tempDir, `img_${ts}.jpg`);
        const outVideo = path.join(tempDir, `out_${ts}.mp4`);

        // Download user's image
        const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempImg, res.data);

        // FFmpeg Magic (Green Screen Overlay)
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(tempImg)     // Background Image
                .loop()
                .input(videoPath)   // Green Screen Video
                .complexFilter([
                    // Resize image to 720p
                    "[0:v]scale=1280:720,setsar=1[bg]",
                    // Resize video to 720p and apply chroma key (remove green)
                    "[1:v]scale=1280:720,setsar=1,format=rgba,chromakey=0x00FF00:0.15:0.10[fg]",
                    // Overlay video on top of image
                    "[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
                ])
                .outputOptions([
                    "-map [outv]",
                    "-map 1:a?",         // Keep audio from video if exists
                    "-c:v libx264",
                    "-pix_fmt yuv420p",
                    "-preset fast",      // Changed to 'fast' for Render's limited CPU
                    "-crf 28",           // Slightly compressed to save memory & time
                    "-c:a aac",
                    "-shortest",
                    "-movflags +faststart"
                ])
                .on("error", (err, stdout, stderr) => {
                    console.error("FFmpeg Error:", stderr);
                    reject(err);
                })
                .on("end", resolve)
                .save(outVideo);
        });

        if (!fs.existsSync(outVideo)) {
            throw new Error("Video process fail ho gaya.");
        }

        // Send the final edited video
        api.sendMessage({
            body: `✨ Ye lijiye aapki video!\n🎥 Overlay: ${randomFile}`,
            attachment: fs.createReadStream(outVideo)
        }, threadID, () => {
            // Delete temp files after sending
            setTimeout(() => {
                [tempImg, outVideo].forEach(f => {
                    if (fs.existsSync(f)) fs.unlinkSync(f);
                });
            }, 10000);
        }, messageID);

    } catch (err) {
        console.error(err);
        reply("❌ Error aagaya: " + (err.message || "Unknown error"));
    }
};
                  
