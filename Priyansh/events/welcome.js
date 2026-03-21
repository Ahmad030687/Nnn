const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "welcome",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    credits: "Ahmad RDX",
    description: "Naye members ko poster ke sath welcome karein"
};

module.exports.run = async ({ event, api, Users }) => {
    const { threadID, logMessageData } = event;

    // Agar bot khud add hua ho toh welcome nahi karega
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) return;

    for (let user of logMessageData.addedParticipants) {
        let name = await Users.getNameUser(user.userFbId);
        let uid = user.userFbId;

        // Poster API (Ye auto-generate karegi poster)
        // Aap niche wala URL change karke apni pasand ka design bhi laga sakte hain
        let welcomeApi = `https://api.popcat.xyz/welcomecard?background=https://i.imgur.com/8M7X9ID.jpg&text1=${encodeURIComponent(name)}&text2=Welcome+to+RDX+Group&text3=Enjoy+your+stay&avatar=https://graph.facebook.com/${uid}/picture?width=512&height=512`;

        let pathImg = path.join(__dirname, "cache", `welcome_${uid}.png`);
        
        try {
            let res = await axios.get(welcomeApi, { responseType: "arraybuffer" });
            fs.writeFileSync(pathImg, Buffer.from(res.data, "utf-8"));

            api.sendMessage({
                body: `🎊 Khush-Aamdeed ${name}! ✨\n\nRDX Group mein aapka swagat hai. Group ke rules follow karein aur maza karein! 👊`,
                attachment: fs.createReadStream(pathImg)
            }, threadID, () => fs.unlinkSync(pathImg));
        } catch (err) {
            api.sendMessage(`🎊 Welcome ${name}!`, threadID);
        }
    }
};
