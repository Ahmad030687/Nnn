const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const dataPath = __dirname + "/cache/antiAbuseData.json";
const API_KEY = "YOUR_API_KEY"; // replace with a valid API key

module.exports.config = {
  name: "antiabuse",
  version: "11.5.0",
  hasPermssion: 1,
  credits: "Ahmad RDX",
  description: "Smart AI Guard - Balanced Detection",
  commandCategory: "Admin",
  usages: "antiabuse [on/off]",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  const { body, threadID, messageID, senderID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const tid = threadID.toString();
  const sid = senderID.toString();

  if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, { status: {}, warnings: {} });
  let db = fs.readJsonSync(dataPath);
  
  if (!db.status) db.status = {};
  if (!db.warnings) db.warnings = {};

  if (db.status[tid] !== true) return;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo.adminIDs.some(item => item.id == senderID)) return;
  } catch (e) { /* ignore admin check if fails */ }

  try {
    const systemPrompt = `You are a mature group moderator. Your task is to detect REAL abuse while ignoring normal chat.
    
    GUIDELINES:
    - Normal chat like "Pehchana mujhe", "Kaise ho", "Kya ho raha hai", "Peachana" are 100% SAFE. Reply "NO".
    - Only reply "YES" for hardcore abuses (Maa, Behan, sexual slurs) or toxic short-forms (8cl, bc, mc, tmkc, mkc, gandu, randi, bhosda).
    - If someone is just talking normally or making a spelling mistake, do NOT flag it.
    - If the intent is clearly to insult someone's family or use dirty language, reply "YES".
    
    User Message: "${body}"
    
    Reply ONLY with "YES" or "NO".`;

    const res = await axios.post("https://api.openai.com/v1/completions", {
      model: "text-davinci-003",
      messages: [
        { role: "system", content: "You are a logical moderator. Output ONLY YES or NO." },
        { role: "user", content: systemPrompt }
      ],
      max_tokens: 5,
      temperature: 0.2
    }, {
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }
    });

    const aiResponse = res.data.choices[0].message.content.trim().toUpperCase();
    console.log(`[ SMART-GUARD ] MSG: "${body}" | Result: "${aiResponse}"`);

    if (aiResponse.includes("YES")) {
      if (!db.warnings) db.warnings = {};
      if (!db.warnings[sid]) db.warnings[sid] = 0;
      db.warnings[sid] += 1;

      if (db.warnings[sid] >= 2) {
        api.sendMessage(`🚨 [ FINAL WARNING ]\n\nAapko baar-baar samjhaya gaya lekin aapne badtameezi nahi chori.\nGood Bye! 👋`, threadID);
        api.removeUserFromGroup(senderID, threadID);
        db.warnings[sid] = 0; 
      } else {
        const name = await Users.getNameUser(senderID);
        api.sendMessage(`⚠️ [ AI MONITOR ]\n\nOye ${name}!\nZubaan sambhaal kar baat karein. AI ne aapki language detect ki hai.\n\nWarning: ${db.warnings[sid]}/2`, threadID, messageID);
      }
      
      fs.writeJsonSync(dataPath, db);
      api.unsendMessage(messageID);
    }
  } catch (err) {
    console.error("Anti-Abuse Error:", err.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const tid = threadID.toString();
  const content = (args.join(" ") || "").toLowerCase();

  if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, { status: {}, warnings: {} });
  let db = fs.readJsonSync(dataPath);
  
  if (content === "on") {
    if (!db.status) db.status = {};
    db.status[tid] = true;
    fs.writeJsonSync(dataPath, db);
    return api.sendMessage("🛡️ Smart AI Guard: ACTIVATED", threadID, messageID);
  } 
  else if (content === "off") {
    if (!db.status) db.status = {};
    db.status[tid] = false;
    fs.writeJsonSync(dataPath, db);
    return api.sendMessage("🛡️ Smart AI Guard: DEACTIVATED", threadID, messageID);
  } 
  else {
    return api.sendMessage("Usage: .antiabuse [on/off]", threadID, messageID);
  }
};