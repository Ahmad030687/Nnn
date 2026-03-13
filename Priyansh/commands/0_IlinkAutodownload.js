const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.9.5",
    hasPermssion: 0,
    credits: "ISMRST-SHAAN",
    description: "Auto download FB, YT (Shorts), IG, TikTok, Pinterest & Snapchat.",
    commandCategory: "Utilities",
    usages: "Sirf link paste karein",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    // Ye khali rahega kyunki hum handleEvent use kar rahe hain
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID } = event;

    if (!body || !body.startsWith("https://")) return;

    // --- Sabhi Platforms Ki Regex ---
    const fbRegex = /(fb\.watch|facebook\.com|fb\.gg)/ig;
    const igRegex = /(instagram\.com)/ig;
    const ytRegex = /(youtube\.com|youtu\.be|youtube\.com\/shorts)/ig; // YT Shorts added
    const ttRegex = /(tiktok\.com)/ig;
    const pinRegex = /(pinterest\.com|pin\.it)/ig; // Pinterest added
    const snapRegex = /(snapchat\.com|t\.snapchat\.com)/ig; // Snapchat added

    if (fbRegex.test(body) || igRegex.test(body) || ytRegex.test(body) || ttRegex.test(body) || pinRegex.test(body) || snapRegex.test(body)) {

      // 1. Loading Reaction
      api.setMessageReaction("⌛", messageID, () => {}, true);

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const fileName = `shaan_dl_${Date.now()}.mp4`;
      const cachePath = path.join(cacheDir, fileName);

      try {
        const { alldown } = require("arif-babu-downloader");

        // 2. Download logic with multi-platform support
        const res = await alldown(body);
        // Alldown different platforms ke liye alag keys use karta hai
        const videoUrl = res.data.high || res.data.low || res.data.url || res.data.video;

        if (!videoUrl) {
           api.setMessageReaction("❌", messageID, () => {}, true);
           return;
        }

        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        const videoTitle = res.data.title || "Social Media Video";
        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle} 💔\n\n✨❁ ━━ ━[ 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 ]━ ━━ ❁✨`;

        // 3. Send and Success Reaction
        return api.sendMessage({
          body: caption,
          attachment: fs.createReadStream(cachePath)
        }, threadID, (err) => {
          if (!err) {
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

      } catch (err) {
        console.error("Download Error:", err.message);
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }
    }
  }
};
