const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pinterest",
  version: "6.0.0",
  hasPermission: 0,
  credits: "AHMAD RDX",
  description: "Pinterest HD Downloader (Ultra Stealth Build)",
  commandCategory: "Media",
  usages: "[query] [quantity]",
  cooldowns: 15 
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  let query = args.join(" ");
  
  if (!query) return api.sendMessage("💡 Please provide a search query.\nExample: .pinterest aesthetic 5", threadID, messageID);

  const rdx_header = "🦅 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐏𝐈𝐍𝐓𝐄𝐑𝐄𝐒𝐓 🦅";
  const line = "━━━━━━━━━━━━━━━━━━";

  let quantity = 1;
  const lastArg = args[args.length - 1];
  if (!isNaN(lastArg) && args.length > 1) {
    quantity = parseInt(lastArg);
    query = args.slice(0, -1).join(" ");
    if (quantity > 10) quantity = 10; 
    if (quantity < 1) quantity = 1;
  }

  try {
    const apiUrl = `https://pinterest-api.p.rapidapi.com/v1/searches/query=${encodeURIComponent(query)}&per_page=${quantity}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'YOUR_RAPID_API_KEY',
        'X-RapidAPI-Host': 'pinterest-api.p.rapidapi.com'
      }
    };
    const res = await axios.get(apiUrl, options);
    const images = res.data.results; 
    
    if (!res.data.results || !images || images.length === 0) {
      return api.sendMessage("❌ No results found for your query.", threadID, messageID);
    }

    const attachments = [];
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    for (let i = 0; i < images.length; i++) {
      const imgUrl = images[i].image_url;
      const imgPath = path.join(cacheDir, `rdx_pin_${Date.now()}_${senderID}_${i}.jpg`);
      
      try {
        const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(imgRes.data));
        attachments.push(fs.createReadStream(imgPath));
      } catch (e) {
        console.log(`[ PINTEREST ] Skip image error: ${e}`);
      }
    }

    if (attachments.length === 0) return api.sendMessage("❌ Failed to download images.", threadID, messageID);

    return api.sendMessage({
      body: `${rdx_header}\n${line}\n✅ Results for: ${query}\n📸 Quantity: ${attachments.length}\n${line}`,
      attachment: attachments
    }, threadID, (err) => {
      attachments.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(`Error: ${error.message}`, threadID, messageID);
  }
};