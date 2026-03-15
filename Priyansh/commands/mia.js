const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "mia",
    version: "5.0.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "Jo aap likhenge wahi Mia Khalifa ke tweet par chhap jayega",
    commandCategory: "fun",
    usages: "[text]",
    cooldowns: 2
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const cachePath = path.join(__dirname, "cache", `mia_tweet_${messageID}.png`);

    // Jo text aapne .mia ke baad likha hai
    const userMsg = args.join(" ");

    if (!userMsg) return api.sendMessage("❌ Kuch likho toh sahi ke Mia kya tweet kare! 😂", threadID, messageID);

    try {
      api.setMessageReaction("📸", messageID, () => {}, true);

      // Aapka diya hua template image
      const templateURL = "https://i.postimg.cc/PfD9mVch/Picsart-26-03-15-15-49-25-496.jpg";

      // Image par likhne ka process
      const image = await Jimp.read(templateURL);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Black font jo white background par dikhe

      // Text Alignment (X=40, Y=145 coordinates template ke mutabiq best hain)
      image.print(font, 40, 145, {
        text: userMsg,
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
      }, 950); // 950 width hai taake text lamba ho toh automatic doosri line mein chala jaye

      await image.writeAsync(cachePath);

      // Final Image bhejna
      return api.sendMessage({
        body: "🔥 **Mia Khalifa ne naya tweet kar diya!**",
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ Photo banane mein masla aa raha hai, library check karein.", threadID, messageID);
    }
  }
};
