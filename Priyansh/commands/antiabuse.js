const axios = require("axios");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "cache", "antiAbuseData.json");

// JSON file initial check
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ status: {}, warnings: {} }, null, 2));
}

function loadData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "antiabuse",
  version: "4.0.0",
  hasPermission: 1,
  credits: "Ahmad RDX",
  description: "Universal AI Abuse Detector (No manual list needed)",
  commandCategory: "Admin",
  usages: "antiabuse [on/off]",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  const { threadID, messageID, senderID, body } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const db = loadData();
  if (!db.status[threadID]) return;

  // Admin Check
  const threadInfo = await api.getThreadInfo(threadID);
  if (threadInfo.adminIDs.some(item => item.id == senderID)) return;

  try {
    //  UNIVERSAL PROMPT: Ab kisi bhi gaali ko batane ki zaroorat nahi
    const systemPrompt = `You are an expert linguistic monitor for South Asian languages (Urdu, Roman Urdu, Hindi, Punjabi) and English.
    Your task is to detect ANY form of abuse, toxicity, or disrespect, especially related to family (mother, sister, etc.), sexual slurs, or derogatory remarks.
    
    Current Message: "${body}"
    
    Analyze the intent. Even if it's coded (like "m_c", "b_c", "8cl") or Roman Urdu slangs. 
    If it is even 0.1% abusive or toxic, reply ONLY with "YES". Otherwise reply "NO".`;

    const res = await axios.post("https://api.ai21.com/v1/chat/completions", {
      model: "j1-jumbo",
      input: systemPrompt
    }, {
      headers: { "Authorization": `Bearer ${global.config.AI21_API_KEY}` }
    });

    const aiResponse = res.data.output.trim().toUpperCase();

    if (aiResponse.includes("YES")) {
      let dbWarnings = db.warnings;
      if (!dbWarnings[senderID]) {
        dbWarnings[senderID] = 0;
      }
      dbWarnings[senderID]++;

      if (dbWarnings[senderID] >= 2) {
        api.sendMessage(` [ ELIMINATED ]\n\nBohot badtameezi ho gayi. Warning limit (2/2) khatam.\nGood Bye!`, threadID);
        api.removeUserFromGroup(senderID, threadID);
        dbWarnings[senderID] = 0;
      } else {
        const name = await Users.getNameUser(senderID);
        api.sendMessage(` [ AHMII MONITOR ]\n\nOye ${name}!\nBadtameezi detect hui hai. Sudhar jao warna nikaal diye jaoge.\nWarning: ${dbWarnings[senderID]}/2`, threadID, messageID);
      }
      
      db.warnings = dbWarnings;
      saveData(db);
      api.unsendMessage(messageID);
    }
  } catch (err) {
    console.error("Anti-Abuse Error:", err.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const state = args[0]?.toLowerCase();
  const db = loadData();

  if (state == "on") {
    db.status[threadID] = true;
    saveData(db);
    return api.sendMessage(" Universal AHMMI Anti-Abuse: ACTIVATED", threadID, messageID);
  } else if (state == "off") {
    db.status[threadID] = false;
    saveData(db);
    return api.sendMessage(" Universal AHMMI Anti-Abuse: DEACTIVATED", threadID, messageID);
  } else {
    return api.sendMessage("Usage: .antiabuse [on/off]", threadID, messageID);
  }
};