const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "sara",
  version: "1.2",
  role: 0,
  credits: "SHAAN-KHAN",
  description: "Sara AI Voice (Auto-Cache Logic)",
  usages: "[text]",
  cooldowns: 5,
};

module.exports.onStart = async function ({ api, event, args }) {
  const text = args.join(" ");
  if (!text) return api.sendMessage("😏 Shaan... mujhse kuch pucho na...", event.threadID);

  api.setMessageReaction("⌛", event.messageID, () => {}, true);

  // 📂 AUTO CACHE FOLDER CHECK & CREATE
  const cachePath = path.join(__dirname, "cache");
  fs.ensureDirSync(cachePath); // Agar folder nahi hoga toh ye line bana degi

  try {
    // 🤖 GROK AI (Logic Same)
    const ai = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-beta",
        messages: [
          {
            role: "system",
            content: "Tumhara naam Sara hai 🙂 Tum Shaan ki naughty girlfriend ho ❤️ Pakistan se ho. Roman Urdu zyada use karti ho. Cute naughty style me baat karti ho. Shaan ko 'Janu' bolo."
          },
          { role: "user", content: text }
        ]
      },
      {
        headers: {
          "Authorization": "Bearer YOUR_GROK_API_KEY", // <--- Apni key yahan lagao
          "Content-Type": "application/json"
        }
      }
    );

    const reply = ai.data.choices[0].message.content;

    // 🔊 VOICE GENERATION (Logic Same)
    const voiceRes = await axios.get(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(reply)}&tl=ur&client=tw-ob`,
      { responseType: "arraybuffer" }
    );

    const filePath = path.join(cachePath, `${event.senderID}.mp3`);
    fs.writeFileSync(filePath, Buffer.from(voiceRes.data));

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    api.sendMessage(
      {
        body: reply,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => {
        // File bhejne ke baad delete karna (Storage bachane ke liye)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    );

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ AI error ho gaya Shaan...", event.threadID);
  }
};
