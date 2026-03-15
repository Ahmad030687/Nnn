const axios = require("axios");

module.exports = {
  config: {
    name: "gay",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "AI se sabit karwayein ke agla banda gay hai 😂",
    commandCategory: "fun",
    usages: "[mention/reply]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions } = event;

    let targetID, targetName;

    // 1. Target Pehchanna
    if (event.type == "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage("⚠️ Oye! Pehle kisi 'Shakki' banday ko tag karo ya uske message par reply karo! 😂", threadID, messageID);
    }

    try {
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID].name;

      api.setMessageReaction("🏳️‍🌈", messageID, () => {}, true);

      // --- SYSTEM PROMPT FOR AI ---
      const systemPrompt = `Tumhara naam 'Gay Detective' hai. Tumhara kaam ye sabit karna hai ke "${targetName}" 100% gay hai. 
      Tumhein bohot funny, thora zaleel karne wala aur desi slang (Roman Urdu) mein baat karni hai. 
      Aisi mazaqia wajohaat (reasons) do jo sun kar sab hansain (e.g. ye larkon ko dekh kar aankh marta hai, iska chalne ka style larki jaisa hai, iske nakhre bohot hain). 
      Jawab 3-4 lines ka ho aur full 'software update' wala ho. Last mein aik ganda sa mazaqia mashwara bhi do. 
      Emojis zaroor use karna (🌈, 😂, 💅, 🕺).`;

      const apiKey = "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"; // Aapki Groq Key

      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Prove that ${targetName} is gay.` }
          ],
          max_tokens: 250,
          temperature: 0.9
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const aiReply = res.data.choices[0].message.content;

      return api.sendMessage({
        body: `🌈 **GAY REPORT BY AHMAD KING** 🌈\n\n${aiReply}`,
        mentions: [{ tag: targetName, id: targetID }]
      }, threadID, messageID);

    } catch (error) {
      console.log(error);
      return api.sendMessage("Banda itna 'Mix' hai ke AI ka dimaag ghum gaya! 😂 (Limit reached)", threadID, messageID);
    }
  }
};
