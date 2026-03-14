const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "wish",
  version: "1.2.1",
  hasPermssion: 0,
  credits: "𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗",
  description: "Birthday wish with Anti-Block Image Loader",
  commandCategory: "Fun",
  usages: "wish @mention / name",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, messageID, senderID, mentions } = event;

  let targetName;
  if (Object.keys(mentions).length > 0) {
    targetName = mentions[Object.keys(mentions)[0]].replace("@", "");
  } else if (args.length > 0) {
    targetName = args.join(" ");
  } else {
    return api.sendMessage("🎂 Please mention someone to wish!\nExample: .wish @Khan Zadi", threadID, messageID);
  }

  const wishes = [
    `Happy Birthday ${targetName}! 🎉 Allah aapko hamesha khush rakhay. Ameen! ✨`,
    `Salgirah Mubarak ho ${targetName}! 🎂 Hamesha hanste muskurate raho! 🥳`,
    `Janum din mubarak ho ${targetName}! 🌟 Aapki har dua poori ho! 💖`,
    `Baar baar din ye aaye... Happy Birthday ${targetName}! 🎈`,
    `Mubarak ho ${targetName}! Aaj party toh banti hai na phir? 🎊`
  ];

  const imgUrls = [
    "https://i.ibb.co/HDLcjcCq/65be868fa417.jpg",
    "https://i.ibb.co/JW5w8pvY/d7d097ef6fe5.jpg",
    "https://i.ibb.co/ymZmSRPT/611cb7b1517f.jpg",
    "https://i.ibb.co/395KfF7c/f8c5acf7d7eb.jpg",
    "https://i.ibb.co/x8JkPTJ5/dc57b0e52eb4.jpg"
  ];

  const randomWish = wishes[Math.floor(Math.random() * wishes.length)];
  const randomImg = imgUrls[Math.floor(Math.random() * imgUrls.length)];

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const imgPath = path.join(cacheDir, `bday_card_${Date.now()}.jpg`);

    // 🔴 BYPASS ADDED HERE: Fake Browser Identity (User-Agent)
    const response = await axios.get(randomImg, { 
      responseType: "arraybuffer", 
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      }
    });
    
    await fs.writeFile(imgPath, Buffer.from(response.data));

    const finalMsg = `🎊 𝐇𝐀𝐏𝐏𝐘 𝐁𝐈𝐑𝐓𝐇𝐃𝐀𝐘 🎊\n━━━━━━━━━━━━━━━━━━\n\n${randomWish}\n\n━━━━━━━━━━━━━━━━━━\n💝 𝐖𝐢𝐬𝐡𝐞𝐝 𝐛𝐲: ${await Users.getNameUser(senderID)}\n✨ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗`;

    return api.sendMessage({
      body: finalMsg,
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }, messageID);

  } catch (error) {
    console.error("Birthday Card Error:", error);
    // Ab bot asal error message bhi dikhayega (e.g. 403, 404, etc.)
    return api.sendMessage(`🎂 Happy Birthday ${targetName}! 🎉\n\n(⚠️ Image load failed: ${error.message})`, threadID, messageID);
  }
};
