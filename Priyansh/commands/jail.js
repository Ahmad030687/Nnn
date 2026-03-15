module.exports.config = {
    name: "band",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Ahmad",
    description: "Reply ya Mention karne par user ki DP ko jail mein dalna",
    commandCategory: "fun",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;

    // --- ID NIKALNE KA LOGIC ---
    let id;
    if (type == "message_reply") {
        id = messageReply.senderID; // Reply kiya to uski ID
    } else if (Object.keys(mentions).length > 0) {
        id = Object.keys(mentions)[0]; // Mention kiya to pehle mention ki ID
    } else {
        id = senderID; // Warna apni ID
    }

    try {
        // ❌ ERROR ZONE: Bot B ko ye lines aur missing modules fix karne honge
        // 'createCanvas', 'loadImage', 'fs', 'axios' sab missing hain.
        
        const canvas = createCanvas(600, 600);
        const ctx = canvas.getContext("2d");
        
        // Facebook Graph API se DP mangwana
        const avatarUrl = `https://graph.facebook.com/${id}/picture?width=1024&height=1024&access_token=${global.account.accessToken}`;
        
        // Image Load karna
        const imageResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
        const avatar = await loadImage(Buffer.from(imageResponse.data, "utf-8"));
        
        ctx.drawImage(avatar, 0, 0, 600, 600);
        
        // Jail Filter (Online Overlay)
        const jailBars = await loadImage("https://raw.githubusercontent.com/Ahmad030687/Assets/main/jail_bars.png");
        ctx.drawImage(jailBars, 0, 0, 600, 600);

        const pathImg = __dirname + `/cache/jail_${id}.png`;
        const buffer = canvas.toBuffer();
        
        fs.writeFileSync(pathImg, buffer);

        // Result Bhejna
        return api.sendMessage({
            body: "Gunehgaar ko jail bhej diya gaya hai! ⚖️",
            attachment: fs.createReadStream(pathImg)
        }, threadID, () => fs.unlinkSync(pathImg), messageID);

    } catch (err) {
        // Ye error Bot A crash karega aur Bot B ko signal jayega
        throw new Error("AUTO_FIX_REQUIRED: " + err.message);
    }
};
