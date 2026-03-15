const axios = require("axios");
const fs = require("fs-extra");

// File path
const path = __dirname + "/cache/manoStatus.json";

module.exports.config = {
  name: "mano",
  version: "12.7.0",
  hasPermssion: 0,
  credits: "AHMAD RDX",
  description: "Strict Alexa-Style Logic - Final Fixed",
  commandCategory: "AI",
  usages: "mano [on/off/text]",
  cooldowns: 2
};

const OWNER_UID = ["61577631137537", "61586449536740"]; 

// ================= AUTO REPLY LOGIC =================
module.exports.handleEvent = async function ({ api, event }) {
  const { body, type, messageReply, threadID, messageID, senderID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const input = body.toLowerCase().trim();
  const tid = threadID.toString(); // ID ko string mein convert kiya

  // 1. Load Status Safely
  if (!fs.existsSync(path)) fs.writeJsonSync(path, {});
  let status = fs.readJsonSync(path);
  
  // 2. Switch Logic (Ye hamesha kaam karega)
  if (input === "mano on" || input === ".mano on") {
    status[tid] = true;
    fs.writeJsonSync(path, status);
    return api.sendMessage("Mano On ho gayi hai! Ab baat karo. 😉", threadID, messageID);
  }
  
  if (input === "mano off" || input === ".mano off") {
    status[tid] = false;
    fs.writeJsonSync(path, status);
    return api.sendMessage("Mano Off! Chalo bye, ab tang mat karna. 🙄", threadID, messageID);
  }

  // 3. 🛡️ STRICT GUARD (Asli Fixed Line)
  // Agar status false hai, toh yahin se program khatam. Niche ka kuch nahi chalega.
  if (status[tid] === false) return;

  // 4. Prefix Filter (Command ke waqt Mano chup rahegi)
  const prefixes = [".", "/", "!", "?", "#"];
  if (prefixes.some(p => input.startsWith(p)) && !input.startsWith("mano")) return;

  // 5. Trigger Logic (Sirf tab chalega jab Mano ON hogi)
  const isReplyToBot = (type === "message_reply" && messageReply && messageReply.senderID === api.getCurrentUserID());
  const isManoKeyword = input.startsWith("mano");

  if (isManoKeyword || isReplyToBot) {
    const query = isManoKeyword ? body.replace(/mano/i, "").trim() : body;
    
    // Agar sirf 'mano' likha ho bina prompt ke
    if (isManoKeyword && !query && input === "mano") {
        return api.sendMessage("Jee Jaan? Kuch bolo to sahi... 😘", threadID, messageID);
    }
    
    return chatWithMano(api, event, query || "hi");
  }
};

// ================= COMMAND RUN (.mano on/off) =================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const content = args.join(" ").toLowerCase();
  const tid = threadID.toString();

  if (!fs.existsSync(path)) fs.writeJsonSync(path, {});
  let status = fs.readJsonSync(path);

  if (content === "on") {
    status[tid] = true;
    fs.writeJsonSync(path, status);
    return api.sendMessage("Mano Active! ✅", threadID, messageID);
  }
  
  if (content === "off") {
    status[tid] = false;
    fs.writeJsonSync(path, status);
    return api.sendMessage("Mano Deactivated! ❌", threadID, messageID);
  }

  // Agar user ne direct prompt dia ho .mano [text]
  if (status[tid] === false) return api.sendMessage("⚠️ Mano OFF hai! Pehle '.mano on' likho.", threadID, messageID);

  if (!content) return api.sendMessage("Usage: mano [on/off/text]", threadID, messageID);
  
  return chatWithMano(api, event, args.join(" "));
};

// ================= CHAT FUNCTION =================
async function chatWithMano(api, event, query) {
  const apiKey = "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"; 
  const isOwner = OWNER_UID.includes(event.senderID.toString());

  const systemPrompt = isOwner
    ? "Tumhara naam Mano hai. Tum Karachi ki romantic larki ho. Tumhara Owner AHMAD RDX hai. Usay 'Janu' bulao. 2-3 lines mein flirty jawab do."
    : "Tumhara naam Mano hai. Tum thodi attitude wali larki ho. Sabko 'Dost' bulao. Short aur funny jawab do.";

  try {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
      max_tokens: 200,
      temperature: 0.7 
    }, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
    });

    const reply = res.data.choices[0].message.content;
    api.setMessageReaction(isOwner ? "❤️" : "😎", event.messageID, () => {}, false);
    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (error) {
    return api.sendMessage("Mano ka dimagh ghoom gaya hai (API Error)!", event.threadID);
  }
}
