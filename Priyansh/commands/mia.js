const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "mia",
    version: "4.0.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "Mia Khalifa ke template par text likh kar photo bhejta hai",
    commandCategory: "fun",
    usages: "[mention/reply] [message]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions } = event;

    let targetID, targetName, userMsg;

    // 1. Target aur Message nikalna
    if (event.type == "message_reply") {
      targetID = messageReply.senderID;
      userMsg = args.join(" ");
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      userMsg = args.join(" ").replace(/@[^ ]+/g, "").trim();
    } else {
      return api.sendMessage("⚠️ Oye! Kisi ko tag karo ya reply karo aur message likho!", threadID, messageID);
    }

    if (!userMsg) return api.sendMessage("❌ Saath mein message toh likho ke Mia kya kahe!", threadID, messageID);

    try {
      api.setMessageReaction("📸", messageID, () => {}, true);

      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID].name;
      
      // Aapka diya hua template link
      const templateURL = "https://i.postimg.cc/PfD9mVch/Picsart-26-03-15-15-49-25-496.jpg";
      const cachePath = path.join(__dirname, "cache", `mia_${messageID}.png`);

      // Tagged user ka handle
      const targetTag = `@${targetName.replace(/\s/g, '').toLowerCase()}`;
      const finalContent = `${targetTag} ${userMsg}`;

      // 2. Image Processing Start
      const image = await Jimp.read(templateURL);
      // Font load karna (Jimp ke built-in fonts)
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

      // Text ko image par chapna (X=45, Y=140 coordinates approx template ke mutabiq)
      // 900 width di hai taake text wrap ho jaye
      image.print(font, 45, 140, {
        text: finalContent,
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
      }, 900);

      await image.writeAsync(cachePath);

      // 3. Image bhejna
      return api.sendMessage({
        body: `🔥 **Mia Khalifa ne @${targetName} ki le li!**`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ Image edit karne mein masla aa raha hai!", threadID, messageID);
    }
  }
};
