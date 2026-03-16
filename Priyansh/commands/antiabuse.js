const axios = require("axios");

module.exports.config = {
  name: "antiabuse",
  version: "2.0.0",
  hasPermssion: 1, // Sirf Admin ON/OFF kar sakein
  credits: "Ahmad RDX",
  description: "Groq AI based Anti-Abuse system with Warning & Kick",
  commandCategory: "Admin",
  usages: "antiabuse [on/off]",
  cooldowns: 5
};

// Warning Store karne ke liye
if (!global.rdxWarnings) global.rdxWarnings = new Map();
if (!global.antiAbuseStatus) global.antiAbuseStatus = new Map();

module.exports.handleEvent = async function ({ api, event, Users }) {
  const { threadID, messageID, senderID, body } = event;
  
  // Agar system OFF hai ya message khali hai toh return
  if (!global.antiAbuseStatus.get(threadID) || !body) return;

  // Admin Check: Admins ko detect nahi karna
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(item => item.id == senderID);
  if (isAdmin) return;

  try {
    // GROQ AI Detector Prompt
    const prompt = `Analyze this message for any abuse, toxicity, or slurs in Roman Urdu, Hindi, or English.
    Check for:
    1. Direct abuses (bc, mc, bkl, tmkc, gandu, etc.)
    2. Leetspeak/Math language (1=I, 2=D, 3=E, 4=A, 5=S, 7=T, 8=B, 0=O).
    3. Hidden slurs or 0.1% toxicity.
    
    Message: "${body}"
    
    If it is abusive in any way, reply ONLY with "YES". If it is safe, reply ONLY with "NO".`;

    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.1-70b-versatile",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { "Authorization": `Bearer ${global.config.GROQ_API_KEY}` } // Aapki API Key yahan use hogi
    });

    const aiResponse = res.data.choices[0].message.content.trim();

    if (aiResponse.includes("YES")) {
      let userWarnings = global.rdxWarnings.get(senderID) || 0;
      userWarnings++;

      if (userWarnings >= 2) {
        // Kick Logic
        api.sendMessage(`🚨 [ FINAL ACTION ]\n\nUser ID: ${senderID}\nWarning Limit: 2/2\nAbuse Detected: "${body}"\n\nAapko warnings ke bawajood badtameezi karne par group se remove kiya ja raha hai. Bye!`, threadID);
        api.removeUserFromGroup(senderID, threadID);
        global.rdxWarnings.set(senderID, 0); // Reset after kick
      } else {
        // Warning Logic
        global.rdxWarnings.set(senderID, userWarnings);
        const name = await Users.getNameUser(senderID);
        api.sendMessage(`⚠️ [ ANTI-ABUSE WARNING ]\n\nOye ${name}!\nBadtameezi mat karo. MAI ne tumhare message mein abuse detect kiya hai.\n\nWarning: ${userWarnings}/2\nNote: Agli baar seedha KICK!`, threadID, messageID);
      }
      // Message delete karne ki koshish (Agar bot admin hai)
      api.unsendMessage(messageID);
    }

  } catch (err) {
    console.log("Anti-Abuse Error: " + err.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const state = args[0]?.toLowerCase();

  if (state == "on") {
    global.antiAbuseStatus.set(threadID, true);
    return api.sendMessage("🛡️ Anti-Abuse AI System is now: ON\nAb har message par Groq AI ki nazar hai!", threadID, messageID);
  } else if (state == "off") {
    global.antiAbuseStatus.set(threadID, false);
    return api.sendMessage("🛡️ Anti-Abuse AI System is now: OFF", threadID, messageID);
  } else {
    return api.sendMessage("Usages: .antiabuse [on/off]", threadID, messageID);
  }
};

