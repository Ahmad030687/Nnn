const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "autodl_360p",
    version: "5.5.0",
    hasPermssion: 0,
    credits: "ISMRST-SHAAN",
    description: "Auto download All-in-One with 360p Preference & Custom Caption.",
    commandCategory: "Utilities",
    usages: "Sirf link paste karein",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID } = event;

    if (!body || !body.includes("https://")) return;

    // Sabhi platforms ke liye regex
    const dlRegex = /(youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|tiktok\.com|twitter\.com|x\.com|threads\.net|pinterest\.com)/ig;

    if (dlRegex.test(body)) {
      const link = body.match(/\bhttps?:\/\/\S+/gi)[0];
      
      // 1. Loading Reaction
      api.setMessageReaction("⌛", messageID, () => {}, true);

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const cachePath = path.join(cacheDir, `shaan_dl_${Date.now()}.mp4`);

      try {
        const { alldown } = require("arif-babu-downloader");
        const res = await alldown(link);
        
        // 360p ko priority dena, fir high/low check karna
        const videoUrl = res.data["360p"] || res.data.high || res.data.low || res.data.url;
        const videoTitle = res.data.title || "Social Media Video";

        if (!videoUrl) {
           api.setMessageReaction("❌", messageID, () => {}, true);
           return;
        }

        // Check file size (Messenger limit 25MB-40MB depending on bot)
        const head = await axios.head(videoUrl);
        const fileSizeMB = (head.headers['content-length'] || 0) / (1024 * 1024);

        // Caption format jaisa aapne maanga tha
        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle} 💔\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

        // Agar file 25MB se badi hai toh Direct Link bhejega
        if (fileSizeMB > 25) {
          api.setMessageReaction("🔗", messageID, () => {}, true);
          return api.sendMessage({
            body: `${caption}\n\n⚠️ Video size bada hai (${fileSizeMB.toFixed(2)}MB), isliye link bhej raha hoon:\n📥 Download: ${videoUrl}`,
          }, threadID, messageID);
        }

        // Download and Send
        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

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
