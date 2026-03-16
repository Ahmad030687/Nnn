const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// File path
const dataPath = __dirname + "/cache/antiAbuseData.json";
const API_KEY = "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";

module.exports.config = {
  name: "antiabuse",
  version: "9.0.0",
  hasPermssion: 1, // Sirf Admin
  credits: "Ahmad RDX",
  description: "Aggressive Anti-Abuse mapped from Mano logic",
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

  // 1. Load Status Safely (Just like Mano)
  if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, { status: {}, warnings: {} });
  let db = fs.readJsonSync(dataPath);

  // 2. Agar status false hai, toh yahin ruk jao (Mano Logic)
  if (db.status[tid] !== true) return;

  // 3. Admin Check (Group admins ko kuch na kahe)
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(item => item.id == senderID);
    if (isAdmin) return; // Admin hai toh aage mat barho
  } catch (e) {
    // Agar API ka masla ho toh ignore karo
  }

  // 4. API Call Trigger
  try {
    const systemPrompt = `You are a strict Cyber-Security Profanity Filter. 
    Analyze the message for toxicity, explicit slang, or family insults in Roman Urdu, Hindi, Punjabi, and English.
    - Detect words like: "chut", "gaand", "bhosda", "maa ki", "behen ka", "bkl", "tmkc", "mkc", "bc", "mc", "randi", "kanjar", "gandu", "gashti".
    - Check for math-coded slurs: "8cl" (BKL), "m_c", "b_c", "1un", "chut1ya".
    
    If the message is even 1% offensive or abusive, reply strictly with ONLY the word "YES".
    If it is clean, reply strictly with ONLY the word "NO".`;

    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile", // Mano wala same model
      messages: [
        { role: "system", content: "Strictly output ONLY YES or NO. No explanations." },
        { role: "user", content: `Message: "${body}"\n\n${systemPrompt}` }
      ],
      max_tokens: 10,
      temperature: 0.1 
    }, {
      headers: { 
        "Authorization": `Bearer ${API_KEY}`, 
        "Content-Type": "application/json" // MANO WALA FIX!
      }
    });

    const aiResponse = res.data.choices[0].message.content.trim().toUpperCase();
    
    // Logs mein show karega (Render par check karne ke liye)
    console.log(`[ ANTI-ABUSE ] MSG: "${body}" | AI: "${aiResponse}"`);

    if (aiResponse.includes("YES")) {
      // Warning Set karo
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
      
      // Data Save karo (Mano style)
      fs.writeJsonSync(dataPath, db);
      api.unsendMessage(messageID);
    }
  } catch (err) {
    console.error("Anti-Abuse API Error:", err.message);
  }
};

// ================= COMMAND RUN (.antiabuse on/off) =================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const tid = threadID.toString();
  const content = (args.join(" ") || "").toLowerCase();

  // File check
  if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, { status: {}, warnings: {} });
  let db = fs.readJsonSync(dataPath);

  if (content === "on") {
    db.status[tid] = true;
    fs.writeJsonSync(dataPath, db);
    return api.sendMessage("🛡️ Universal AI Guard: ACTIVATED\nAb group mein gaaliyan ban hain! 🚫", threadID, messageID);
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
