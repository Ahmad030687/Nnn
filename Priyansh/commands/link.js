/**
 * paste.js - Sardar RDX Cloud Storage
 * Credits: Ahmad Ali Safdar
 */

module.exports.config = {
  name: "link",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ahmad Ali",
  description: "Upload code/text to Pastebin and get a link",
  commandCategory: "tools",
  usages: "paste [text/code]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const axios = require("axios");
  const { threadID, messageID } = event;

  const codeToPaste = args.join(" ");
  if (!codeToPaste) return api.sendMessage("⚠️ Ahmad bhai, kuch likhein to sahi upload karne ke liye!", threadID, messageID);

  // 🔥 PASTEBIN API KEY
  const API_KEY = "0AbxK5-T82-AaDU8WBgXqzrXoGNB2389";

  api.sendMessage("⏳ AHMAD RDX Vault mein upload ho raha hai...", threadID, messageID);

  try {
    const params = new URLSearchParams();
    params.append('api_dev_key', API_KEY);
    params.append('api_option', 'paste');
    params.append('api_paste_code', codeToPaste);
    params.append('api_paste_name', `SardarRDX_Paste_${Date.now()}`);
    params.append('api_paste_private', '1'); // 1 = Unlisted (Professional choice)
    params.append('api_paste_expire_date', '10M'); // 10 Minutes (Temporary storage)

    const response = await axios.post('https://pastebin.com/api/api_post.php', params);

    if (response.data.includes('https://pastebin.com/')) {
      return api.sendMessage({
        body: `🦅 **SARDAR RDX - CLOUD VAULT**\n✨ Status: Uploaded Successfully\n🔗 Link: ${response.data}\n\n⚠️ Ye link 10 minute baad expire ho jayega.`
      }, threadID, messageID);
    } else {
      throw new Error(response.data);
    }

  } catch (e) {
    console.error(e);
    return api.sendMessage(`❌ Error: Pastebin API nakhre kar rahi hai.\nLog: ${e.message}`, threadID, messageID);
  }
};
