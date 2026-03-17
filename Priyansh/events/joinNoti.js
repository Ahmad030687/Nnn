const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.0.0",
    credits: "AHMAD RDX",
    description: "Advanced Welcome Notification with Time-based Greetings",
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.run = async function({ api, event }) {
    const { threadID } = event;
    const { join } = path;

    // --- 🕒 Time & Greeting Logic ---
    const now = new Date();
    const hours = now.getHours();
    const timeString = now.toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }); // Pakistan Time
    
    let greeting = "";
    if (hours >= 5 && hours < 12) greeting = "🌅 Good Morning";
    else if (hours >= 12 && hours < 17) greeting = "☀️ Good Afternoon";
    else if (hours >= 17 && hours < 20) greeting = "🌆 Good Evening";
    else greeting = "🌙 Good Night";

    // --- 🤖 CASE 1: When Bot joins the group ---
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        api.changeNickname(`{ ${global.config.PREFIX} } × ${(!global.config.BOTNAME) ? "bot" : global.config.BOTNAME}`, threadID, api.getCurrentUserID());
        
        const introMsg = `🌺 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐁𝐎𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 🌺\n━━━━━━━━━━━━━━━━━━\n✅ Bot Successfully Joined!\n🛠️ Owner: AHMAD RDX\n💡 Type ${global.config.PREFIX}help to see commands.\n━━━━━━━━━━━━━━━━━━`;
        
        // Agar aapke paas cache mein video hai toh wo jayegi, warna sirf text
        const videoPath = join(__dirname, "cache", "lv_7256561222877826306_20250410093120.mp4");
        if (fs.existsSync(videoPath)) {
            return api.sendMessage({ body: introMsg, attachment: fs.createReadStream(videoPath) }, threadID);
        } else {
            return api.sendMessage(introMsg, threadID);
        }
    }

    // --- 👤 CASE 2: When a Member joins ---
    else {
        try {
            let { threadName, participantIDs } = await api.getThreadInfo(threadID);
            const addedParticipants = event.logMessageData.addedParticipants;

            for (let newParticipant of addedParticipants) {
                const userName = newParticipant.fullName;
                const totalMembers = participantIDs.length;

                // 🛠️ The exact card format you requested
                let msg = `${greeting},\n\n┏━━━━━━━━━━━━━━━┓\n┃ 👤 𝐌𝐞𝐦𝐛𝐞𝐫: ${userName}\n┃ 🏰 𝐆𝐫𝐨𝐮𝐩: ${threadName}\n┃ 👥 𝐓𝐨𝐭𝐚𝐥 𝐔𝐬𝐞𝐫𝐬: ${totalMembers}\n┃ ⏰ 𝐉𝐨𝐢𝐧𝐞𝐝 𝐀𝐭: ${timeString}\n┗━━━━━━━━━━━━━━━┛\n\nWelcome to our group! Enjoy your stay. ✨`;

                // --- 🖼️ Attachment Logic (Gif/Photo/Video) ---
                const pathJoinGif = join(__dirname, "cache", "joinGif");
                const randomGifDir = join(pathJoinGif, "randomgif");
                
                let formPush = { body: msg, mentions: [{ tag: userName, id: newParticipant.userFbId }] };

                // Check for random gifs/videos in cache
                if (fs.existsSync(randomGifDir)) {
                    const files = fs.readdirSync(randomGifDir);
                    if (files.length > 0) {
                        const randomFile = files[Math.floor(Math.random() * files.length)];
                        formPush.attachment = fs.createReadStream(join(randomGifDir, randomFile));
                    }
                }

                return api.sendMessage(formPush, threadID);
            }
        } catch (e) {
            console.log("JoinNoti Error: ", e);
        }
    }
};
