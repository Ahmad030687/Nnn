const axios = require("axios");
const { execSync } = require("child_process");
const logger = require("../../utils/log");
const config = require("../../config.json");

module.exports.config = {
  name: "update",
  version: "1.0.1",
  hasPermssion: 2,
  credits: "Shaan Khan",
  description: "Update bot from Shaan Khan's GitHub repo",
  commandCategory: "system",
  usages: "update",
  cooldowns: 10
};

// 🌐 AAPKA GITHUB RAW CONFIG LINK
// Note: Isse tabhi kaam karega jab aapke repo ka naam 'Shaan-Khan-K' hai aur branch 'main' hai.
const REMOTE_CONFIG_URL = "https://raw.githubusercontent.com/shaankhank22223/Shaan-Khan-K/main/config.json";

module.exports.run = async function ({ api, event }) {
  try {
    // 🔒 Admin check
    if (!config.ADMINBOT.includes(event.senderID)) {
      return api.sendMessage(
        "❌ Sirf bot owner update chala sakta hai.",
        event.threadID
      );
    }

    api.sendMessage("🔍 Apne GitHub se update check kar raha hoon...", event.threadID);

    const res = await axios.get(REMOTE_CONFIG_URL, { timeout: 10000 });
    const remoteVersion = res.data.version;
    const localVersion = config.version;

    if (!remoteVersion) {
      return api.sendMessage("❌ GitHub se version data nahi mila.", event.threadID);
    }

    if (remoteVersion === localVersion) {
      return api.sendMessage(`✅ Bot pehle se hi latest hai (v${localVersion})`, event.threadID);
    }

    api.sendMessage(
      `⚠️ New Update Mil Gaya!\n\nLocal: ${localVersion}\nGitHub: ${remoteVersion}\n\n⏳ Files download ho rahi hain...`,
      event.threadID
    );

    // 🔁 GIT COMMANDS (Aapke repo se sync karne ke liye)
    // Ye commands ensure karegi ki aapke GitHub se latest code aaye
    execSync("git fetch --all", { stdio: "inherit" });
    execSync("git reset --hard origin/main", { stdio: "inherit" });
    execSync("npm install", { stdio: "inherit" });

    api.sendMessage(
      "✅ Update Mukammal!\n♻️ Bot ab restart ho raha hai...",
      event.threadID
    );

    logger(`Updated to v${remoteVersion} from GitHub`, "[ UPDATE ]");

    // ♻️ Restart bot
    process.exit(1);

  } catch (err) {
    api.sendMessage("❌ Update Failed!\nError: " + err.message, event.threadID);
    logger(err.message, "[ UPDATE ERROR ]");
  }
};
