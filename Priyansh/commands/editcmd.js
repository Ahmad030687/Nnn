const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "editcmd",
  version: "1.0.0",
  hasPermssion: 2, // Sirf Bot Admin/Owner
  credits: "Ahmad RDX",
  description: "Kisi bhi command ka code edit karein live",
  commandCategory: "System",
  usages: ".editcmd [command_name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const commandName = args[0];

  if (!commandName) return api.sendMessage("❌ Command ka naam toh batao bhai! (.editcmd help)", threadID, messageID);

  const filePath = path.join(__dirname, `${commandName}.js`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return api.sendMessage(`❌ '${commandName}' naam ki koi file nahi mili.`, threadID, messageID);
  }

  // 1. Read Old Code
  const oldCode = fs.readFileSync(filePath, "utf-8");

  // 2. Send Old Code and Ask for New Code
  return api.sendMessage(
    `📝 **COMMAND:** ${commandName}.js\n\n👇 Ye raha purana code. Is message par apna **Naya Code** reply (Reply) karein.\n\n\`\`\`javascript\n${oldCode}\n\`\`\``,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        commandName: commandName,
        filePath: filePath
      });
    },
    messageID
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { body, threadID, messageID, senderID } = event;

  // Security: Sirf wahi banda reply kare jisne command chalayi
  if (senderID != handleReply.author) return;

  try {
    // 3. Save New Code
    fs.writeFileSync(handleReply.filePath, body, "utf-8");

    // 4. Hot-Reload the Command
    delete require.cache[require.resolve(handleReply.filePath)];
    const newCommand = require(handleReply.filePath);
    
    // Global client mein update karna
    global.client.commands.delete(handleReply.commandName);
    global.client.commands.set(newCommand.config.name, newCommand);

    return api.sendMessage(
      `✅ SUCCESS!\n\nCommand '${handleReply.commandName}' update ho gayi hai aur load bhi ho chuki hai.`,
      threadID,
      messageID
    );
  } catch (error) {
    return api.sendMessage(`❌ ERROR: Code save ya load nahi ho saka.\n\n${error.message}`, threadID, messageID);
  }
};

