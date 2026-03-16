module.exports.config = {
    name: "unsend",
    version: "1.0.1",
    hasPermission: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐬𝐡 𝐏𝐮𝐭",
    description: "Gỡ tin nhắn của bot",
    commandCategory: "system",
    usages: "unsend",
    cooldowns: 0
};

module.exports.languages = {
    "vi": {
        "returnCant": "Không thể gỡ tin nhắn của người khác.",
        "missingReply": "Hãy reply tin nhắn cần gỡ."
    },
    "en": {
        "returnCant": "Can't unsend message of others.",
        "missingReply": "Please reply the message you want to unsend."
    }
}

module.exports.run = function({ api, event, getText }) {
    if (event.type != "message_reply") return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
    if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
    return api.unsendMessage(event.messageReply.messageID);
}