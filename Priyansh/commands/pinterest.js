const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pinterest",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "AHMAD RDX",
  description: "Pinterest HD Downloader (Ultra Stealth Build)",
  commandCategory: "Media",
  usages: "[query] [quantity]",
  cooldowns: 60 
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  let query = args.join(" ");
  
  // 🛡️ SILENT INPUT CHECK (No Message = No Ban)
  if (!query) return; 

  const rdx_header = "🦅 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐏𝐈𝐍𝐓𝐄𝐑𝐄𝐒𝐓 🦅";
  const line = "━━━━━━━━━━━━━━━━━━";

  // 🛡️ QUANTITY CAP (Nayi ID ke liye Max 5 behtar hai)
  let quantity = 1;
  const lastArg = args[args.length - 1];
  if (!isNaN(lastArg) && args.length > 1) {
    quantity = parseInt(lastArg);
    query = args.slice(0, -1).join(" ");
    if (quantity > 5) quantity = 5; // Temporarily lock to 5
    if (quantity < 1) quantity = 1;
  }

  try {
    const apiUrl = `https://insta-pin-api-j0qy.onrender.com/pinterest-api?q=${encodeURIComponent(query)}&limit=${quantity}`;
    const res = await axios.get(apiUrl);
    const images = res.data.result; 
    
    // 🛡️ SILENT ERROR (Agar images na milien toh chup raho)
    if (!res.data.status || !images || images.length === 0) return;

    const attachments = [];
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    for (let i = 0; i < images.length; i++) {
      const imgUrl = images[i];
      // File name mein senderID taake clash na ho
      const imgPath = path.join(cacheDir, `rdx_pin_${Date.now()}_${senderID}_${i}.jpg`);
      
      try {
        const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(imgRes.data));
        attachments.push(fs.createReadStream(imgPath));
      } catch (e) {
        console.log(`Download Error ignored.`);
      }
    }

    if (attachments.length === 0) return;

    // 🛡️ SAFE SEND (Callback Cleanup)
    return api.sendMessage({
      body: `${rdx_header}\n${line}\n✅ Results for: ${query}\n📸 Engine: RDX-DeepScan\n${line}`,
      attachment: attachments
    }, threadID, (err) => {
      // Cleanup only AFTER message is sent
      attachments.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }, messageID);

  } catch (error) {
    console.error("Silent Catch: ", error.message);
    // 🛡️ No error message sent to FB - User will just think server is slow
  }
};
