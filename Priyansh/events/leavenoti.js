const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
    name: "leave",
    eventType: ["log:unsubscribe"],
    version: "2.1.0",
    credits: "AHMAD RDX",
    description: "Notify when a member leaves or is kicked with specific reasons",
    dependencies: {
        "fs-extra": "",
        "path": "",
        "moment-timezone": ""
    }
};

module.exports.run = async function({ api, event, Threads }) {
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    const { threadID } = event;
    const { createReadStream, existsSync, readdirSync } = fs;
    const { join } = path;

    try {
        // --- 🕒 Time & Date Logic ---
        const timeNow = moment.tz("Asia/Karachi");
        const hours = timeNow.format("HH");
        const timeStr = timeNow.format("hh:mm:ss");
        const dateStr = timeNow.format("DD/MM/YYYY");

        let session = "";
        if (hours >= 5 && hours < 12) session = "Subah";
        else if (hours >= 12 && hours < 16) session = "Dopahar";
        else if (hours >= 16 && hours < 19) session = "Sham";
        else session = "Raat";

        // --- 📝 Reason & Name Logic ---
        const leftID = event.logMessageData.leftParticipantFbId;
        const authorID = event.author;
        const info = await api.getUserInfo(leftID);
        const name = info[leftID].name;

        // Wajah Check: Agar nikalne wala aur nikalne wala same hain toh "Khud gaya"
        const isKicked = (authorID != leftID);
        const wajah = isKicked 
            ? "Admin ne group se bahar nikal diya 😑👈" 
            : "Khud group chhod kar nikal gaya 😐👈";

        // --- 🏰 Group Info ---
        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo.threadName || "Unknown Group";
        const totalMembers = threadInfo.participantIDs.length;

        // --- 🛠️ The Exact Card Format You Requested ---
        let msg = `┏━━━━━━━━━━━━━━━┓\n┃ 👤 𝐌𝐞𝐦𝐛𝐞𝐫: ${name}\n┃ 📝 𝐖𝐚𝐣𝐚𝐡: ${wajah}\n\n┃ 🕒 𝐓𝐢𝐦𝐞: ${session} ${timeStr}\n┃ 📅 𝐃𝐚𝐭𝐞: ${dateStr}\n\n┃ 🏰 𝐆𝐫𝐨𝐮𝐩 𝐍𝐚𝐦𝐞: ${threadName}\n┃ 👥 𝐓𝐨𝐭𝐚𝐥 𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${totalMembers}\n┗━━━━━━━━━━━━━━━┛`;

        // --- 🖼️ Attachment Logic ---
        const randomGifDir = join(__dirname, "cache", "leaveGif", "randomgif");
        let formPush = { body: msg };

        if (existsSync(randomGifDir)) {
            const files = readdirSync(randomGifDir);
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                formPush.attachment = createReadStream(join(randomGifDir, randomFile));
            }
        }

        return api.sendMessage(formPush, threadID);

    } catch (e) {
        console.log("LeaveNoti Error: ", e);
    }
};
