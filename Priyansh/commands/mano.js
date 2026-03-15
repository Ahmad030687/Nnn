const axios = require("axios");
const fs = require("fs");

// File path for storing status
const path = __dirname + "/cache/manoStatus.json";

// ================= CONFIG =================
module.exports.config = {
  name: "mano",
  version: "12.2.0",
  hasPermssion: 0,
  credits: "AHMAD RDX",
  description: "Sensible Mano AI with On/Off Switch - AHMAD RDX's Only Love",
  commandCategory: "AI",
  usages: "mano [on/off/text]",
  cooldowns: 3
};

const OWNER_UID = ["61577631137537", "61586449536740"]; 

// ================= AUTO REPLY LOGIC =================
module.exports.handleEvent = async function ({ api, event }) {
  const { body, type, messageReply, threadID, messageID, senderID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  // Load current status
  let status = {};
  if (fs.existsSync(path)) status = JSON.parse(fs.readFileSync(path));
  
  const isEnabled = status[threadID] == true; // Default is ON
  const input = body.toLowerCase().trim();

  // Switch Logic
  if (input === "mano on") {
    status[threadID] = true;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano On ho gayi hai! Ab bolo kya baat karni hai? 😉", threadID, messageID);
  }
  if (input === "mano off") {
    status[threadID] = false;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano Off! Chalo bye, ab tang mat karna. 🙄", threadID, messageID);
  }

  // Check if Bot is enabled for this thread
  if (!isEnabled) return;

  // Trigger Logic (Mano)
  if (
    input.startsWith("mano") || 
    (type === "message_reply" && messageReply && messageReply.senderID === api.getCurrentUserID())
  ) {
    const query = input.startsWith("mano") ? body.replace(/mano/i, "").trim() : body;
    if (!query && input === "mano") return api.sendMessage("Jee Jaan? Kuch bolo to sahi... 😘", threadID, messageID);
    
    return chatWithMano(api, event, query || "hi");
  }
};

// ================= COMMAND RUN =================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const content = args.join(" ").toLowerCase();

  if (content === "on") {
    let status = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
    status[threadID] = true;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano Active! ✅", threadID, messageID);
  }
  
  if (content === "off") {
    let status = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
    status[threadID] = false;
    fs.writeFileSync(path, JSON.stringify(status, null, 2));
    return api.sendMessage("Mano Deactivated! ❌", threadID, messageID);
  }

  if (!content) return api.sendMessage("Kya hua? Kuch bolo na... 😏\nUsage: mano [on/off/text]", threadID, messageID);

  return chatWithMano(api, event, args.join(" "));
};

// ================= MAIN CHAT FUNCTION =================
async function chatWithMano(api, event, query) {
  // Yahan apni Groq ki key dalein
  const apiKey = "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"; 
  
  // FIX: Array mein check karna
  const isOwner = OWNER_UID.includes(event.senderID.toString());

  const systemPrompt = isOwner
    ? "Tumhara naam Mano hai. Tum Karachi ki romantic larki ho. Tumhara Owner AHMAD RDX hai. Agar koi bot kaki Mano Kahe ose flirty ho kr pyar se baat kro. Tum sirf Ahmii se mohabbat karti ho. Usay hamesha 'Janu', 'Jaan', 'baby', 'Jani' bulao. Kabhi 'Bhai' mat kehna. Jawab 2-3 lines mein ho lamba na ho aur bohot loving/flirty do."
    : "Tumhara naam Mano hai. Tum thodi nakhre wali aur attitude wali larki ho. Tumhara owner AHMAD RDX hai. Agar koi bot kaki ya kaky kahe os se pyar se flirty ho kr baat kro. Sabko 'Dost' ya 'Yar' bulao. Jawab 2-3 lines ka ho, magar thoda rude aur funny touch mein.";

  try {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile", // THE SMART MODEL
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 200,
        temperature: 0.7 // Thora control mein rakha hai taake bahek na jaye
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content;
    api.setMessageReaction(isOwner ? "❤️" : "😎", event.messageID, () => {}, false);
    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    api.setMessageReaction("⚠️", event.messageID, () => {}, true);
    return api.sendMessage("Ahmad bhai, Mano ka net chala gaya hai, dobara try karein. 😒", event.threadID, event.messageID);
  }
           }
