const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "alexa",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ahmad RDX", // Credits updated as per your brand
  description: "Chat with Alexa AI (Clear Sweet Female Voice)",
  commandCategory: "AI",
  usages: "alexa [message] or alexa on/off",
  cooldowns: 2
};

const alexaStatus = new Map();

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const content = args.join(" ");

  if (content.toLowerCase() === "on") {
    alexaStatus.set(threadID, true);
    return api.sendMessage("✅ Alexa AI is now ON. Ab main group mein active hoon! ✨", threadID, messageID);
  }
  if (content.toLowerCase() === "off") {
    alexaStatus.set(threadID, false);
    return api.sendMessage("❌ Alexa AI is now OFF. Milte hain baad mein! Bye. 👋", threadID, messageID);
  }

  if (!content) return api.sendMessage("❓ Ji Ahmad bhai, kuch bolna hai? Maslan: .alexa kaisi ho?", threadID, messageID);

  return chatWithAlexa(api, event, content);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, type, messageReply } = event;
  if (!body) return;

  const isEnabled = alexaStatus.get(threadID) || false;
  const botID = api.getCurrentUserID();

  if (isEnabled) {
    if (body.toLowerCase().startsWith("alexa ") || (type === "message_reply" && messageReply.senderID === botID)) {
      const query = body.toLowerCase().startsWith("alexa ") ? body.slice(6) : body;
      return chatWithAlexa(api, event, query);
    }
  }
};

async function chatWithAlexa(api, event, query) {
  const { threadID, messageID } = event;
  
  // 🎀 Sweet personality prompt
  const systemPrompt = "Tumhara naam Alexa hai. Tum Karachi se ho aur ek bohot pyari, narm mizaj Muslim larki ho. Tum hamesha Roman Urdu mein baat karti ho. Tumhara lehja bohot sweet aur respectful hai. Jawab short aur dilchasp dena.";
  
  try {
    // 1. AI Chat Logic
    const aiRes = await axios.get(`https://api.kraza.qzz.io/ai/customai?q=${encodeURIComponent(query)}&systemPrompt=${encodeURIComponent(systemPrompt)}`);
    
    if (aiRes.data.status && aiRes.data.response) {
      const aiText = aiRes.data.response;
      
      // 2. Clear Female TTS Logic (Using a more stable & sweet engine)
      // Hum Google-Hindi Female voice use kar rahe hain jo Roman Urdu ke liye best hai
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(aiText)}&tl=hi&client=tw-ob`;

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
      
      const audioPath = path.join(cacheDir, `alexa_voice_${Date.now()}.mp3`);
      
      const audioRes = await axios.get(ttsUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(audioPath, Buffer.from(audioRes.data));

      if (fs.existsSync(audioPath)) {
        return api.sendMessage({
          body: aiText,
          attachment: fs.createReadStream(audioPath)
        }, threadID, (err) => {
          // Cleanup
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        }, messageID);
      }
    }
  } catch (error) {
    console.error("Alexa Error:", error.message);
    // Bot B will detect this throw and fix it if needed!
    throw error; 
  }
}
