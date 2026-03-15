const axios = require("axios");
const fs = require("fs");

// File path
const path = __dirname + "/cache/manoStatus.json";

module.exports.config = {
  name: "mano",
  version: "12.6.0",
  hasPermssion: 0,
  credits: "AHMAD RDX",
  description: "Strict On/Off Logic - Alexa Style",
  commandCategory: "AI",
  usages: "mano [on/off/text]",
  cooldowns: 3
};

const OWNER_UID = ["61577631137537", "61586449536740"]; 

// ================= AUTO REPLY LOGIC =================
module.exports.handleEvent = async function ({ api, event }) {
  const { body, type, messageReply, threadID, messageID, senderID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  // 1. Load Status
  let status = {};
  if (fs.existsSync(path)) status = JSON.parse(fs.readFileSync(path));
  
  const input = body.toLowerCase().trim();

  // 2. Switch Logic (Ye hamesha chalega taake ON kiya ja sake)
  if (input === "mano on" || input === ".mano on") {
    status[threadID] = true;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano On ho gayi hai! 😉", threadID, messageID);
  }
  
  if (input === "mano off" || input === ".mano off") {
    status[threadID] = false;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano Off! Chalo bye. 🙄", threadID, messageID);
  }

  // 3. STRICT GUARD: Agar OFF hai, toh yahan se RETURN (khatam). 
  // Iske niche ka koi bhi code (reply/trigger) nahi chalega.
  if (status[threadID] === false) return;

  // 4. Prefix Filter: Agar koi aur command (.uns etc) hai toh Mano chup rahe
  const prefixes = [".", "/", "!", "?", "#"];
  if (prefixes.some(p => input.startsWith(p)) && !input.startsWith("mano")) return;

  // 5. Trigger Logic
  if (
    input.startsWith("mano") || 
    (type === "message_reply" && messageReply && messageReply.senderID === api.getCurrentUserID())
  ) {
    const query = input.startsWith("mano") ? body.replace(/mano/i, "").trim() : body;
    if (!query && input === "mano") return api.sendMessage("Jee Jaan? 😘", threadID, messageID);
    
    return chatWithMano(api, event, query || "hi");
  }
};

// ================= COMMAND RUN =================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const content = args.join(" ").toLowerCase();
  let status = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};

  if (content === "on") {
    status[threadID] = true;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano Active! ✅", threadID, messageID);
  }
  
  if (content === "off") {
    status[threadID] = false;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano Deactivated! ❌", threadID, messageID);
  }

  // Agar OFF hai toh chat function nahi chalega
  if (status[threadID] === false) return api.sendMessage("Mano OFF hai jani!", threadID, messageID);

  return chatWithMano(api, event, args.join(" "));
};

async function chatWithMano(api, event, query) {
  const apiKey = "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"; 
  const isOwner = OWNER_UID.includes(event.senderID.toString());

  const systemPrompt = isOwner
    ? "Tumhara naam Mano hai. Tum Karachi ki romantic larki ho. Tumhara Owner AHMAD RDX hai. Usay 'Janu' bulao. 2-3 lines ka flirty jawab do."
    : "Tumhara naam Mano hai. Nakhre wali larki ho. Sabko 'Dost' bulao. Rude aur funny jawab do.";

  try {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
        max_tokens: 200,
        temperature: 0.7 
    }, { headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" } });

    const reply = res.data.choices[0].message.content;
    api.setMessageReaction(isOwner ? "❤️" : "😎", event.messageID, () => {}, false);
    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (error) {
    return api.sendMessage("API Error!", event.threadID);
  }
}
