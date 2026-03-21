module.exports.config = {
    name: "antiout",
    version: "1.5.0",
    credits: "Ahmad RDX", // Fix by Ahmad RDX
    hasPermssion: 1,
    description: "Enable or disable antiout with auto-add engine",
    usages: "antiout on/off",
    commandCategory: "Admin",
    cooldowns: 0
};

// --- SECTION 1: ACTION ENGINE (Ye asal kaam karta hai) ---
module.exports.handleEvent = async ({ api, event, Threads }) => {
    const { threadID, logMessageType, logMessageData, author } = event;

    // Sirf tab trigger ho jab koi group chore
    if (logMessageType !== "log:unsubscribe") return;

    // Agar bot ko khud nikala gaya ho toh ruk jao
    if (logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    // Database se check karo ke ON hai ya nahi
    let data = (await Threads.getData(threadID)).data || {};
    if (data.antiout !== true) return;

    // Agar admin ne nikala (Kick kiya) toh wapas nahi layega
    if (author !== logMessageData.leftParticipantFbId) return;

    const uid = logMessageData.leftParticipantFbId;

    // Wapas add karne ka process
    api.addUserToGroup(uid, threadID, (err) => {
        if (err) {
            console.log("Anti-out Error: " + err);
        } else {
            api.sendMessage(`🔥 [ RDX PRISON ] 🔥\n\nBeta RDX ki ijazat ke bina exit mana hai! Wapas aao.`, threadID);
        }
    });
};

// --- SECTION 2: THE SWITCH (Ye ON/OFF karne ke liye hai) ---
module.exports.run = async({ api, event, Threads }) => {
    let data = (await Threads.getData(event.threadID)).data || {};
    
    if (typeof data["antiout"] == "undefined" || data["antiout"] == false) {
        data["antiout"] = true;
    } else {
        data["antiout"] = false;
    }

    await Threads.setData(event.threadID, { data });
    
    // Global data update (taake bot ko fauran pata chal jaye)
    if (global.data && global.data.threadData) {
        global.data.threadData.set(parseInt(event.threadID), data);
    }

    return api.sendMessage(`**${(data["antiout"] == true) ? "Enabled✅" : "Disabled❌"} successfully the antiout function for RDX members**`, event.threadID);
};
