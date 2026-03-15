const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "sing",
  version: "0.0.1",
  hasPermssion: 0,
  credits: "ArYAN",
  description: "Download music from YouTube",
  commandCategory: "music",
  usages: "/sing <song name or link>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  if (!args.length)
    return api.sendMessage("❌ Provide a song name or YouTube URL.", event.threadID, event.messageID);

  const query = args.join(" ");
  const waiting = await api.sendMessage("✅ Apki Request Jari Hai please wait...", event.threadID);

  try {
    let videoUrl;

    if (query.startsWith("http")) {
      videoUrl = query;
    } else {
      const data = await yts(query);
      if (!data.videos.length) throw new Error("No results found.");
      videoUrl = data.videos[0].url;
    }

    const apiUrl = `http://65.109.80.126:20409/aryan/play?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiUrl);

    if (!res.data.status || !res.data.downloadUrl)
      throw new Error("API did not return download link.");

    const mp3name = `${res.data.title}.mp3`.replace(/[\\/:"*?<>|]/g, "");
    const filePath = path.join(__dirname, mp3name);

    const audio = await axios.get(res.data.downloadUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, audio.data);

    await api.sendMessage(
      {
        body: ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑨𝑯𝑴𝑨𝑫 𝑹𝑫𝑿««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 𝑴𝑼𝑺𝑰𝑪\\n━━━━━━━━━━━━${res.data.title}`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => {
        fs.unlinkSync(filePath);
        api.unsendMessage(waiting.messageID);
      }
    );

  } catch (err) {
    api.unsendMessage(waiting.messageID);
    return api.sendMessage("❌ Failed to download: " + err.message, event.threadID, event.messageID);
  }
};
