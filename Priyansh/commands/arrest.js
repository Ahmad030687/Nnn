module.exports.config = {
  name: "arrest",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Ahmad RDX",
  description: "Put someone in jail (Non-API version with intentional crash)",
  commandCategory: "system",
  usages: "jail [mention]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    api.sendMessage("⌛ Jail ki salakhain tayyar ho rahi hain...", threadID);

    if (mentions.length === 0) return api.sendMessage("Mention a user to jail!", threadID, messageID);

    const mentionId = Object.keys(mentions)[0];
    const mentionInfo = await api.getUserInfo(mentionId);

    if (!mentionInfo) return api.sendMessage("Invalid user mention!", threadID, messageID);

    const userAvatar = mentionInfo.profileUrl;

    // Replace image processing code here
    console.log("Processing image for: " + userAvatar);

    return api.sendMessage("🚨 User jail mein band ho gaya!", threadID, messageID);

  } catch (err) {
    throw err;
  }
};