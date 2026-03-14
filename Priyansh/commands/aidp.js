const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "aidp",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗",
  description: "Ultra-Fast Aesthetic Theme Changer",
  commandCategory: "Group",
  usages: "aitheme [prompt]",
  prefix: true,
  cooldowns: 10
};

// --- Power Timeout (Is se bot kabhi nahi atkega) ---
const requestWithTimeout = (url, timeout) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return axios.get(url, { responseType: 'arraybuffer', signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("✨ 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝘆𝗽𝗲 𝘀𝗼𝗺𝗲𝘁𝗵𝗶𝗻𝗴! (e.g: .aidp neon car)", threadID, messageID);

  // Instant Feedback (Pata chale bot zinda hai)
  const processing = await api.sendMessage("🚀 **Working on it...**", threadID);

  // Bakwas ko Beautiful banane wala magic formula
  const magicPrompt = `(Masterpiece, 8k, Ultra-HD), beautiful aesthetic, cute vibes, professional lighting, ${query}`;

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  const tempFile = path.join(cacheDir, `theme_fast_${Date.now()}.png`);

  try {
    // 15 seconds ka "Zardasti" timeout - API hang hui to bot aage nikal jayega
    const res = await requestWithTimeout(`https://api.kraza.qzz.io/imagecreator/text2img?q=${encodeURIComponent(magicPrompt)}`, 18000);

    fs.writeFileSync(tempFile, Buffer.from(res.data));

    // Seedha DP badlo
    await api.changeGroupImage(fs.createReadStream(tempFile), threadID);

    api.unsendMessage(processing.messageID);
    return api.sendMessage(`✅ **Group Dp Updated Successfully!**\n🎨 Prompt: ${query}\n👤 By: 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗`, threadID, () => {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    });

  } catch (error) {
    api.unsendMessage(processing.messageID);
    console.error(error);
    
    // Agar stuck hua to ye message aayega (Atkega nahi)
    const errorMsg = error.name === 'CanceledError' 
      ? "⏳ **API is too slow right now.** Stuck hone se behtar tha main ruk jata. Dobara try karein!" 
      : "❌ **Failed!** Bot admin hai? Ya server down hai.";
      
    return api.sendMessage(errorMsg, threadID, messageID);
  }
};
