const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const dataPath = __dirname + "/cache/antiAbuseData.json";
const API_KEY = "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";

module.exports.config = {
  name: "antiabuse",
  version: "10.0.0",
  hasPermssion: 1,
  credits: "Ahmad RDX",
  description: "Strict AI Guard - Fixed TypeError & Math Slang",
  commandCategory: "Admin",
  usages: "antiabuse [on/off]",
  cooldowns: 2
};

// ================= AUTO DETECT LOGIC =================
module.exports.handleEvent = async function ({ api, event, Users }) {
  const { body, threadID, messageID, senderID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const tid = threadID.toString();
  const sid = senderID.toString();

  // 🛠️ DATA LOADING & AUTO-REPAIR (TypeError Fix)
  if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, { status: {}, warnings: {} });
  let db = fs.readJsonSync(dataPath);
  
  // Ensure objects exist to prevent "Cannot set properties of undefined"
  if (!db.status) db.status = {};
  if (!db.warnings) db.warnings = {};

  if (db.status[tid] !== true) return;

  // Admin Check
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo.adminIDs.some(item => item.id == senderID)) return;
  } catch (e) { /* ignore */ }

  try {
    const systemPrompt = `You are a strict Cyber-Security Profanity Filter. Detect ANY abuse, especially Roman Urdu/Punjabi/English slurs.
    - Detect: "maa ki", "behen ka", "chut", "bhosda", "randi", "gashti", "kanjar", "gandu", "bc", "mc", "bkl", "tmkc".
    - Detect Math/Short forms: "8cl", "m_c", "b_c", "1un", "chut1ya".
    - Tone: Even if the user is being "creative" with spelling, identify the intent.
    
    If toxic, reply strictly with ONLY: YES
    If clean, reply strictly with ONLY: NO`;

    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Strictly output ONLY YES or NO. No explanations." },
        { role: "user", content: `Analyze this: "${body}"\n\n${systemPrompt}` }
      ],
      max_tokens: 10,
      temperature: 0.0
    }, {
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }
    });

    const aiResponse = res.data.choices[0].message.content.trim().toUpperCase();
    console.log(`[ ANTI-ABUSE ] MSG: "${body}" | AI: "${aiResponse}"`);

    if (aiResponse.includes("YES")) {
      // Initialize warning for this user if it doesn't exist
      if (!db.warnings[sid]) db.warnings[sid] = 0;
      
      db.warnings[sid] += 1;

      if (db.warnings[sid] >= 2) {
        api.sendMessage(`🚨 [ ELIMINATED ]\n\nBohat gaaliyan de di tumne. Niklo ab group se! 👋`, threadID);
        api.removeUserFromGroup(senderID, threadID);
        db.warnings[sid] = 0; // Reset
      } else {
        const name = await Users.getNameUser(senderID);
        api.sendMessage(`⚠️ [ AI SECURITY ]\n\nOye ${name}!\nBadtameezi mat karo. AI ne tumhari gaali pakar li hai.\n\nWarning: ${db.warnings[sid]}/2\nSudhar jao warna seedha KICK!`, threadID, messageID);
      }
      
      fs.writeJsonSync(dataPath, db); // Save updated data
      api.unsendMessage(messageID);
    }
  } catch (err) {
    console.error("Anti-Abuse Error:", err.message);
  }
};

// ================= COMMAND RUN (.antiabuse on/off) =================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const tid = threadID.toString();
  const content = (args.join(" ") || "").toLowerCase();

  if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, { status: {}, warnings: {} });
  let db = fs.readJsonSync(dataPath);
  
  if (!db.status) db.status = {};
  if (!db.warnings) db.warnings = {};

  if (content === "on") {
    db.status[tid] = true;
    fs.writeJsonSync(dataPath, db);
    return api.sendMessage("🛡️ Universal AI Guard: ACTIVATED", threadID, messageID);
  } 
  else if (content === "off") {
    db.status[tid] = false;
    fs.writeJsonSync(dataPath, db);
    return api.sendMessage("🛡️ Universal AI Guard: DEACTIVATED", threadID, messageID);
  } 
  else {
    return api.sendMessage("Usage: .antiabuse [on/off]", threadID, messageID);
  }
};
