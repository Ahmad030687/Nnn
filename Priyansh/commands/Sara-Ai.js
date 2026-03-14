const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sara",
  version: "2.0",
  role: 0,
  credits: "SHAAN-KHAN",
  description: "Sara AI (Groq API + Voice Logic)",
  hasPrefix: true,
  usages: "[text]",
  cooldowns: 5,
};

module.exports.onStart = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const text = args.join(" ");

  if (!text) return api.sendMessage("😏 Ahmii... mujhse kuch pucho na...", threadID, messageID);

  // Reaction start
  api.setMessageReaction("⌛", messageID, () => {}, true);

  // Cache folder configuration
  const cachePath = path.join(__dirname, "cache");
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
  const filePath = path.join(cachePath, `sara_${senderID}.mp3`);

  try {
    // 🤖 GROQ AI CONNECTION (Fixed URL & Model)
    const aiResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile", // High quality model
        messages: [
          {
            role: "system",
            content: "Tumhara naam Mano hai 🙂 Tum Ahmii ki naughty girlfriend ho ❤️ Pakistan se ho. Roman Urdu zyada use karti ho. Cute naughty style me baat karti ho. Ahmii ko 'Janu' bolo."
          },
          { role: "user", content: text }
        ]
      },
      {
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json"
        }
      }
    );

    const reply = aiResponse.data.choices[0].message.content;

    // 🔊 GOOGLE TTS VOICE GENERATION
    const voiceRes = await axios.get(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(reply)}&tl=ur&client=tw-ob`,
      { responseType: "arraybuffer" }
    );

    fs.writeFileSync(filePath, Buffer.from(voiceRes.data));

    // Success Reaction
    api.setMessageReaction("✅", messageID, () => {}, true);

    // Send Message with Voice
    return api.sendMessage(
      {
        body: reply,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        // Cleaning up cache after sending
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      },
      messageID
    );

  } catch (error) {
    console.error("GROQ ERROR:", error.response ? error.response.data : error.message);
    api.sendMessage("❌ Shaan, Groq API connect nahi ho rahi ya key limit khatam hai.", threadID, messageID);
  }
};
