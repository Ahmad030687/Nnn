const Jimp = require('jimp');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "whatsapp",
  version: "16.0.0",
  hasPermssion: 0,
  credits: "𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗",
  description: "Aesthetic WhatsApp Call - Anti-Text-Error Version",
  commandCategory: "Edit",
  usages: "whatsapp [reply/mention]",
  cooldowns: 15
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  let targetID;
  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (messageReply) {
    targetID = messageReply.senderID;
  } else {
    return api.sendMessage("❌ Reply or mention someone to call!", threadID, messageID);
  }

  const waitMsg = await api.sendMessage("🌸📞 Apki Call Apke Jano Ko Ki Ja Rahi Hai☎️... ✨", threadID);

  try {
    const getImg = async (url) => {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      return await Jimp.read(res.data);
    };

    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const heartLink = "https://i.postimg.cc/rmmpGQqV/images-(3).png";
    const stickerLink = "https://i.ibb.co/LzNf9yk/cute-cats.png"; 

    const [sAv, tAv, heart, sticker, fWhite32, fWhite16] = await Promise.all([
      getImg(`https://graph.facebook.com/${senderID}/picture?width=1000&height=1000&access_token=${token}`),
      getImg(`https://graph.facebook.com/${targetID}/picture?width=1000&height=1000&access_token=${token}`),
      getImg(heartLink),
      getImg(stickerLink).catch(() => new Jimp(1,1)),
      Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
      Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
    ]);

    const base = new Jimp(1000, 900, '#f1f4f9'); 

    const drawScreen = (name, time, avatar) => {
      const screen = new Jimp(420, 780, '#232d36'); 
      
      // DP: Badi photo like your sample
      avatar.resize(380, 420);
      screen.composite(avatar, 20, 140);

      // Name & Status: Text handling to avoid ??? errors
      const safeName = name.replace(/[^\x00-\x7F]/g, ""); // Standard English characters for stability
      const displayName = safeName || "Unknown";
      
      const nW = Jimp.measureText(fWhite32, displayName);
      screen.print(fWhite32, (420 - nW) / 2, 50, displayName);
      
      const tW = Jimp.measureText(fWhite16, time);
      screen.print(fWhite16, (420 - tW) / 2, 95, time);
      
      screen.print(fWhite16, (420 - Jimp.measureText(fWhite16, "🔒 End-to-end encrypted")) / 2, 20, "🔒 End-to-end encrypted");

      // Permanent Dark Buttons Bar
      const btnBar = new Jimp(420, 100, '#1c262d');
      const drawBtn = (color, x, isRed = false) => {
        let btn = new Jimp(55, 55, color);
        btn.circle();
        if(isRed) {
            let icon = new Jimp(25, 6, '#ffffff');
            btn.composite(icon, 15, 25);
        } else {
            let dot = new Jimp(10, 10, '#ffffff');
            dot.circle();
            btn.composite(dot, 22, 22);
        }
        btnBar.composite(btn, x, 22);
      };

      drawBtn('#374248', 30);
      drawBtn('#374248', 120);
      drawBtn('#374248', 210);
      drawBtn('#f03d3d', 330, true); 

      screen.composite(btnBar, 0, 680);
      return screen;
    };

    // Results with Fixed Aesthetic placeholders
    base.composite(drawScreen("JaaN", "2:04:22", sAv), 30, 60);
    base.composite(drawScreen("My Life", "2:06:39", tAv), 550, 60);

    // Decorations
    heart.resize(100, 100);
    base.composite(heart, 450, 400);
    
    if(sticker) {
       sticker.resize(180, 180);
       base.composite(sticker, 800, 10); 
       base.composite(sticker, 20, 720); 
    }

    const cachePath = path.join(__dirname, "cache", `final_wa_rdx_${Date.now()}.png`);
    await base.writeAsync(cachePath);

    api.unsendMessage(waitMsg.messageID);
    return api.sendMessage({
      body: `💞 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐂𝐚𝐥𝐥 𝐀𝐞𝐬𝐭𝐡𝐞𝐭𝐢𝐜 💞\n━━━━━━━━━━━━━━━━\nDesign by Ahmad RDX`,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (err) {
    throw err; 
  }
};
