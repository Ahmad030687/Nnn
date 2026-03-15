const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "mia",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "Mia Khalifa ke provide kiye gaye template image tweet banayein",
    commandCategory: "fun",
    usages: "[mention/reply] [message]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions } = event;
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    let targetID, targetName, userMsg;

    // 1. Target aur Message nikalna
    if (event.type == "message_reply") {
      targetID = messageReply.senderID;
      userMsg = args.join(" ");
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      userMsg = args.join(" ").replace(/@[^ ]+/g, "").trim();
    } else {
      return api.sendMessage("⚠️ Oye! Pehle kisi ko tag karo ya reply karo aur message likho!", threadID, messageID);
    }

    if (!userMsg) return api.sendMessage("❌ Saath mein koi message toh likho!", threadID, messageID);

    try {
      api.setMessageReaction("📸", messageID, () => {}, true);

      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID].name;

      // Tagged user's username formatted for the tweet text
      const targetTag = `@${targetName.replace(/\s/g, '').toLowerCase()}`;
      // Full tweet text to overlay
      const tweetTextRaw = `${targetTag} ${userMsg}`;
      const tweetText = encodeURIComponent(tweetTextRaw);

      // --- CONCEPTUAL API CALL USING THE PROVIDE TEMPLATE ---
      // This part assumes a third-party API exists that can overlay text on the specific template image you provided.
      // Replace 'https://api.your-canvas-service.com' with the actual API endpoint if you have one.
      // If no such service exists, this command will only be a concept.
      const canvasUrl = `https://api.your-canvas-service.com/v1/image-generator/mia-tweet?template=https://i.postimg.cc/PfD9mVch/Picsart-26-03-15-15-49-25-496.jpg&text=${tweetText}&color=black&x=20&y=120`; 

      const imagePath = path.join(cacheDir, `mia_tweet_exact_${messageID}.png`);
      
      const response = await axios.get(canvasUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imagePath, Buffer.from(response.data));

      return api.sendMessage({
        body: `🔥 **Mia Khalifa ne is ganjy @${targetName} ko tweet kiya!**`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => fs.unlinkSync(imagePath), messageID);

    } catch (e) {
      console.error(e);
      // Fallback message if image generation fails
      return api.sendMessage("❌ Thori der baad try karein!", threadID, messageID);
    }
  }
};

