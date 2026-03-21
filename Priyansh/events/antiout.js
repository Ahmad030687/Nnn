module.exports.config = {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "2.0.0",
    credits: "Ahmad RDX",
    description: "100% Direct working antiout - No database needed"
};

module.exports.run = async ({ event, api, Users }) => {
    let { logMessageData, author, threadID } = event;

    // 1. Agar bot ko nikala gaya ho toh ruk jao (Self-protection)
    if (logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    // 2. Sirf tab add karega jab banda KHUD bhagay (Self-leave)
    // Author aur Left ID same honi chahiye
    if (author == logMessageData.leftParticipantFbId) {
        
        const uid = logMessageData.leftParticipantFbId;
        
        // 3. Wapas add karne ka Direct Engine
        api.addUserToGroup(uid, threadID, async (err) => {
            if (err) {
                // Agar add nahi kar saka toh group mein msg bhejega
                api.sendMessage("❌ [ RDX ] Isay wapas nahi la saka! (Bot Admin hona chahiye aur user Bot ka Friend hona chahiye)", threadID);
                console.log(`[ RDX ERROR ] ID: ${uid} ko add nahi kar saka. Error: ${err}`);
            } else {
                // Agar add ho gaya toh ye msg aayega
                let name = await Users.getNameUser(uid) || "Member";
                api.sendMessage(`🔥 [ RDX PRISON ] 🔥\n\nBeta ${name}, kahan bhag rahe ho? RDX ki ijazat ke bina exit mana hai! Wapas aao.`, threadID);
            }
        });
    }
};
