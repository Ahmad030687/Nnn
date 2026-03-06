const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.7.0",
    hasPermssion: 0,
    credits: "SMART SHANKAR",
    description: "Auto download FB, YT, IG, TikTok with auto-cache creation.",
    commandCategory: "Utilities",
    usages: "Sirf link paste karein",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    // Ye khali rahega kyunki hum handleEvent use kar rahe hain
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID } = event;

    // 1. Check message and link
    if (!body || !body.startsWith("https://")) return;

    // 2. Platform detection (Regex)
    const fbRegex = /(fb\.watch|facebook\.com|fb\.gg)/ig;
    const igRegex = /(instagram\.com)/ig;
    const ytRegex = /(youtube\.com|youtu\.be)/ig;
    const ttRegex = /(tiktok\.com)/ig;

    if (fbRegex.test(body) || igRegex.test(body) || ytRegex.test(body) || ttRegex.test(body)) {
      
      // 3. AUTO-CACHE FOLDER CREATION (Tension Free)
      // Ye bot ke main folder mein 'cache' folder dhoondega, nahi toh bana dega
      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const fileName = `shankar_${Date.now()}.mp4`;
      const cachePath = path.join(cacheDir, fileName);

      try {
        const { alldown } = require("arif-babu-downloader");
        api.setMessageReaction("📥", messageID, () => {}, true);

        // 4. Download logic
        const res = await alldown(body);
        const videoUrl = res.data.high || res.data.low;

        if (!videoUrl) return;

        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        // 5. Stylish Caption
        const videoTitle = res.data.title || "Social Media Video";
        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle} 💔\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

        // 6. Send and Cleanup
        return api.sendMessage({
          body: caption,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          // File bhejte hi delete kar do taaki storage na bhare
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

      } catch (err) {
        console.error("Download Error:", err.message);
        // Agar koi error aaye toh console mein dikhega par bot nahi rukega
      }
    }
  }
};
