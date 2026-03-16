module.exports.config = {
  name: "arrest",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ahmad RDX",
  description: "Put someone in jail (Non-API version with intentional crash)",
  commandCategory: "system",
  usages: "jail [mention]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    api.sendMessage("⌛ Jail ki salakhain tayyar ho rahi hain...", threadID);

    //========= ⚠️ INTENTIONAL LOGIC ERROR =========//
    // Yahan 'userAvatar' define nahi hai, bot foran phat jayega!
    console.log("Processing image for: " + userAvatar); 
    //==============================================//

    return api.sendMessage("🚨 User jail mein band ho gaya!", threadID, messageID);

  } catch (err) {
    // Ye line Bot B ko SOS signal bhejne ke liye lazmi hai
    throw err; 
  }
};
