const axios = require("axios");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "cache", "antiAbuseData.json");

// Auto-Fix JSON structure if it's broken or empty
function loadData() {
  try {
    if (!fs.existsSync(dataPath)) {
      const init = { status: {}, warnings: {} };
      fs.writeFileSync(dataPath, JSON.stringify(init, null, 2));
      return init;
    }
    let data = JSON.parse(fs.readFileSync(dataPath));
    // Check if essential keys exist, if not, add them
    if (!data.status) data.status = {};
    if (!data.warnings) data.warnings = {};
    return data;
  } catch (e) {
    return { status: {}, warnings: {} };
  }
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "antiabuse",
  version: "5.0.0",
  hasPermssion: 1,
  credits: "Ahmad RDX",
  description: "Ultimate AI Guard (Detects Math, Slang & Roman Urdu)",
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
    // 🧠 THE ULTIMATE DETECTOR PROMPT
    const systemPrompt = `You are a Zero-Tolerance Toxicity Detector. 
    Analyze the message for any extreme abuse, sexual slurs, or family-related insults (Maa/Behan).
    
    SPECIAL INSTRUCTION: Detect 'Leetspeak' or Math-language slurs:
    - 8 = B, 1 = I/L, 0 = O, 5 = S, 4 = A, 7 = T, 2 = D, 3 = E.
    - Examples: "8cl" (BKL), "m_c", "b_c", "1un" (Lun), "chut1ya".
    - Detect Roman Urdu/Punjabi slurs: "bhosda", "gandu", "randi", "gashti", "kanjar", "m_k_c".
    
    Message: "${body}"
    
    If the message is even 1% toxic or contains hidden abuse, reply ONLY with "YES". If clean, reply "NO".`;

    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: "Strictly output only YES or NO. No explanations." },
        { role: "user", content: systemPrompt }
      ],
      temperature: 0.0 // Strictly logical
    }, {
      headers: { "Authorization": `Bearer ${global.config.GROQ_API_KEY}` }
    });

    const aiResponse = res.data.choices[0].message.content.trim().toUpperCase();

    if (aiResponse.includes("YES")) {
      let userWarnings = db.warnings[senderID] || 0;
      userWarnings++;

      if (userWarnings >= 2) {
        api.sendMessage(`🚨 [ ELIMINATED ]\n\nLimit cross ho gayi! Aapne phir se badtameezi ki.\nBye Bye! 👋`, threadID);
        api.removeUserFromGroup(senderID, threadID);
        db.warnings[senderID] = 0;
      } else {
        db.warnings[senderID] = userWarnings;
        const name = await Users.getNameUser(senderID);
        api.sendMessage(`⚠️ [ AI SECURITY GUARD ]\n\nOye ${name}!\nAI ne tumhare message mein gandi language detect ki hai.\n\nWarning: ${userWarnings}/2\nSudhar jao warna agle message par KICK paray gi!`, threadID, messageID);
      }
      
      saveData(db);
      api.unsendMessage(messageID);
    }
  } catch (err) {
    console.error("Anti-Abuse Logic Error:", err.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const state = args[0]?.toLowerCase();
  const db = loadData();

  if (state == "on") {
    db.status[threadID] = true;
    saveData(db);
    return api.sendMessage("🛡️ Universal AI Guard: ACTIVATED", threadID, messageID);
  } else if (state == "off") {
    db.status[threadID] = false;
    saveData(db);
    return api.sendMessage("🛡️ Universal AI Guard: DEACTIVATED", threadID, messageID);
  } else {
    return api.sendMessage("Usages: .antiabuse [on/off]", threadID, messageID);
  }
};
