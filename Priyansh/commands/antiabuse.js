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
        // Force-fix if keys are missing
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
    version: "7.0.0",
    hasPermssion: 1,
    credits: "Ahmad RDX",
    description: "Final AI Guard: Detects 8cl, m_c, Roman Urdu & Math Slang",
    commandCategory: "Admin",
    usages: "antiabuse [on/off]",
    cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event, Users }) {
    const { threadID, messageID, senderID, body } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const db = loadData();
    if (!db.status[threadID]) return;

    // Admin safety: Admins are allowed to talk freely
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo.adminIDs.some(item => item.id == senderID)) return;

    try {
        // 🧠 THE "NO-ESCAPE" PROMPT
        const systemPrompt = `You are a strict Anti-Abuse Shield. Analyze for toxicity in Roman Urdu, Hindi, Punjabi, and English.
        - Detect family insults (maa, behan, etc).
        - Detect math-coded slurs: 8=B, 1=I, 0=O, 5=S, 4=A, 7=T, 2=D, 3=E (e.g., "8cl", "m_c", "1un", "chut1ya").
        - Detect short-forms: "bc", "mc", "tmkc", "mkc", "bkl", "gandu".
        - If the message is toxic, reply ONLY: YES
        - If clean, reply ONLY: NO`;

        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-70b-versatile",
            messages: [
                { role: "system", content: "Strictly output ONLY 'YES' or 'NO'." },
                { role: "user", content: `Message: "${body}"\n\n${systemPrompt}` }
            ],
            temperature: 0.0
        }, {
            headers: { "Authorization": `Bearer ${global.config.GROQ_API_KEY}` }
        });

        const aiResponse = res.data.choices[0].message.content.trim().toUpperCase();

        if (aiResponse.includes("YES")) {
            // Error fix: Ensure the warning entry exists
            if (!db.warnings[senderID]) db.warnings[senderID] = 0;
            
            db.warnings[senderID] += 1;

            if (db.warnings[senderID] >= 2) {
                api.sendMessage(`🚨 [ ACTION ]\n\nLimit cross! Aapne baar-baar gaali di. Ab group se niklo. 👋`, threadID);
                api.removeUserFromGroup(senderID, threadID);
                db.warnings[senderID] = 0; // Reset
            } else {
                const name = await Users.getNameUser(senderID);
                api.sendMessage(`⚠️ [ AI SECURITY ]\n\nOye ${name}!\nBadtameezi mat karo, AI ne tumhari gaali detect kar li hai.\n\nWarning: ${db.warnings[senderID]}/2\nNote: Agli baar seedha KICK!`, threadID, messageID);
            }
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
        return api.sendMessage("🛡️ Universal AI Guard: ACTIVATED", threadID, messageID);
    } else if (state == "off") {
        db.status[threadID] = false;
        saveData(db);
        return api.sendMessage("🛡️ Universal AI Guard: DEACTIVATED", threadID, messageID);
    } else {
        return api.sendMessage("Usage: .antiabuse [on/off]", threadID, messageID);
    }
};
