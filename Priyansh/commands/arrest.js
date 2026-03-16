const axios = require('axios');
const Jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "arrest",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ahmad RDX",
  description: "Put someone behind bars (Real-time Image Processing)",
  commandCategory: "Edit",
  usages: "jail [mention/reply]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  try {
    let uid;
    if (messageReply) uid = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) uid = Object.keys(mentions)[0];
    else uid = senderID;

    const waitMsg = await api.sendMessage(" Jail ki salakhain laayi ja rahi hain... ", threadID);

    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=1000&height=1000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    const jailBarsUrl = "https://i.postimg.cc/9f7P7mKz/jail-bars.png";

    const userImg = await Jimp.read(avatarUrl); 

    const jailBars = await Jimp.read(jailBarsUrl);

    userImg.resize(1000, 1000);
    jailBars.resize(1000, 1000);

    userImg.composite(jailBars, 0, 0);

    const cachePath = path.join(__dirname, "cache", `jail_${uid}.png`);
    await userImg.writeAsync(cachePath);

    api.unsendMessage(waitMsg.messageID);

    return api.sendMessage({
      body: " Criminal Jail mein band ho gaya! ",
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => fs.unlinkSync(cachePath), messageID);

  } catch (err) {
    throw err; 
  }
};