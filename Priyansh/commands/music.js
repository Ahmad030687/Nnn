const axios = require("axios");
const yts = require("yt-search");

/* 🎞 Loading Frames */
const frames = [
  "🎵 ▰▱▱▱▱▱▱▱▱▱ 10%",
  "🎶 ▰▰▰▰▱▱▱▱▱▱ 40%",
  "🎧 ▰▰▰▰▰▰▱▱▱▱ 70%",
  "❤️ ▰▰▰▰▰▰▰▰▰▰ 100%"
];

/* 🌐 API Setup */
const getBaseApi = async () => {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
    return res.data.api;
  } catch (e) {
    return "https://d-api-24.onrender.com"; 
  }
};

async function getStreamFromURL(url, name) {
  const res = await axios.get(url, { responseType: "stream" });
  res.data.path = name;
  return res.data;
}

function cleanTitle(title = "") {
  return title.replace(/[\\/:*?"<>|]/g, "").trim();
}

module.exports.config = {
  name: "music",
  version: "2.5.0",
  credits: "music", 
  hasPermssion: 0,
  cooldowns: 5,
  description: "Official YouTube MP3 Downloader",
  commandCategory: "media",
  usages: "song <name | link>"
};

module.exports.run = async function ({ api, args, event }) {
  if (!args[0]) {
    return api.sendMessage("❌ Song ka naam ya YouTube link dein.", event.threadID, event.messageID);
  }

  try {
    const loading = await api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID);

    for (const f of frames) {
      await new Promise(r => setTimeout(r, 300));
      await api.editMessage(f, loading.messageID);
    }

    const diptoApi = await getBaseApi();
    const input = args.join(" ");
    
    // Search query ko 'Official Music' ke liye optimize kiya gaya hai
    const isLink = /youtu\.be|youtube\.com/.test(input);
    const searchQuery = isLink ? input : `${input} official music video`;
    
    const search = await yts(searchQuery);
    let video = null;

    if (isLink) {
        video = search.videos[0];
    } else {
        /* 🛡️ OFFICIAL FILTER LOGIC 🛡️ */
        // Search results mein se wo video select karega jo 'Topic', 'VEVO', ya 'Official' channel se ho
        video = search.videos.find(v => 
            v.author.name.toLowerCase().includes('official') || 
            v.author.name.toLowerCase().includes('vevo') || 
            v.author.name.toLowerCase().includes('topic')
        ) || search.videos[0]; // Agar koi official match na mile, tab first result le
    }

    if (!video) {
      return api.sendMessage("⚠️ Maaf kijiye, koi music result nahi mila.", event.threadID, event.messageID);
    }

    // Download API call
    const { data } = await axios.get(`${diptoApi}/ytDl3?link=${video.videoId}&format=mp3`);

    await api.unsendMessage(loading.messageID);

    return api.sendMessage({
      body: `🎵 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n⏱ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${video.timestamp}\n\n✅ Music Optimized & Verified`,
      attachment: await getStreamFromURL(data.downloadLink, `${cleanTitle(video.title)}.mp3`)
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Error: Song download process fail ho gaya.", event.threadID, event.messageID);
  }
};
