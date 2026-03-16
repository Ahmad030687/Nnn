const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
const dataPath = path.join(cacheDir, "antiAbuseData.json");

// --- 🛠️ BULLETPROOF DATA LOADER ---
function loadData() {
    try {
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        if (!fs.existsSync(dataPath)) {
            const init = { status: {}, warnings: {} };
            fs.writeFileSync(dataPath, JSON.stringify(init, null, 2));
            return init;
        }
        let data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        if (!data.status) data.status = {};
        if (!data.warnings) data.warnings = {};
        return data;
    } catch (e) {
        const reset = { status: {}, warnings: {} };
        fs.writeFileSync(dataPath, JSON.stringify(reset, null, 2));
        return reset;
    }
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
    name: "antiabuse",
    version: "8.0.0",
    hasPermssion: 1,
    credits: "Ahmad RDX",
    description: "Ultimate Direct-API Groq Guard (No Config Needed)",
    commandCategory: "Admin",
    usages: "antiabuse [on/off]",
    cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event, Users }) {
    const { threadID, messageID, senderID, body } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const db = loadData();
    if (!db.status[threadID]) return;

    // Admin safety bypass
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo.adminIDs.some(item => item.id == senderID)) return;

    try {
        // 🧠 THE "ZERO-MERCY" PROMPT
        const systemPrompt = `You are a strict, zero-tolerance toxicity detector. 
        Analyze the message for any explicit slang, abuses, or hidden toxicity in Urdu, Hindi, English, and Leetspeak (Math language).
        - Detect direct slurs and insults like: "chot", "chut", "maa ki", "bkl", "bc", "mc", "gandu", "tmkc", "mkc", "madarchod", "behenchod", "randi", "bhosdike", "lun", "laude", "gashti".
        - Detect math/short forms: "8cl", "m_c", "b_c", "1un", "chut1ya".
        
        Message: "${body}"
        
        If it is even 0.01% abusive, disrespectful, or toxic in ANY way, reply strictly with ONLY the word "YES". If completely safe, reply "NO".`;

        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-70b-versatile",
            messages: [
                { role: "system", content: "Strictly output ONLY YES or NO. No punctuation." },
                { role: "user", content: systemPrompt }
            ],
            temperature: 0.0
        }, {
            // 🔑 DIRECT API KEY (Ahmad Bhai's Key)
            headers: { "Authorization": "Bearer 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" }
        });

        const aiResponse = res.data.choices[0].message.content.trim().toUpperCase();

        if (aiResponse.includes("YES")) {
            if (!db.warnings[senderID]) db.warnings[senderID] = 0;
            db.warnings[senderID] += 1;

            if (db.warnings[senderID] >= 2) {
                api.sendMessage(`🚨 [ FINAL ACTION ]\n\nZubaan ko lagaam nahi di na? Ab group se niklo! 👋`, threadID);
                api.removeUserFromGroup(senderID, threadID);
                db.warnings[senderID] = 0; 
            } else {
                const name = await Users.getNameUser(senderID);
                api.sendMessage(`⚠️ [ AI SECURITY GUARD ]\n\nOye ${name}!\nBadtameezi mat karo, AI ne tumhari gaali detect kar li hai.\n\nWarning: ${db.warnings[senderID]}/2\nNote: Agli baar seedha KICK!`, threadID, messageID);
            }
            saveData(db);
            api.unsendMessage(messageID);
        }
    } catch (err) {
        console.error("Anti-Abuse Direct API Error:", err.message);
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const state = args[0]?.toLowerCase();
    const db = loadData();

    if (state == "on") {
        db.status[threadID] = true;
        saveData(db);
        return api.sendMessage("🛡️ Universal AI Guard (Direct-API): ACTIVATED\nAb kisi gaali dene wale ki khair nahi!", threadID, messageID);
    } else if (state == "off") {
        db.status[threadID] = false;
        saveData(db);
        return api.sendMessage("🛡️ Universal AI Guard (Direct-API): DEACTIVATED", threadID, messageID);
    } else {
        return api.sendMessage("Usage: .antiabuse [on/off]", threadID, messageID);
    }
};
