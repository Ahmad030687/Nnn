const { spawn } = require("child_process");
const axios = require("axios");
const logger = require("./utils/log");
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port, '0.0.0.0', () => {
    logger(`Server is running on port ${port}...`, "[ Starting ]");
}).on('error', (err) => {
    logger(`Server error: ${err.message}`, "[ Error ]");
});

///////////////////////////////////////////////////////////
//========= 🛡️ SELF-HEALING ERROR REPORTER =========//
///////////////////////////////////////////////////////////

// NOTE: Jab aap Bot B Render par deploy kar lein, toh niche wala URL lazmi badlein.
const BOT_B_URL = "https://auto-healer.onrender.com"; 

async function reportErrorToFixer(err) {
    try {
        // Hum check karte hain ke kya mano.js file mojud hai
        const filePath = "./modules/commands/mano.js";
        if (!fs.existsSync(filePath)) return;

        const manoCode = fs.readFileSync(filePath, "utf8");
        
        await axios.post(BOT_B_URL, {
            error: err.message,
            stack: err.stack,
            filename: "modules/commands/mano.js",
            code: manoCode
        });
        
        logger("Crash detected! Error report sent to Bot B for auto-fixing...", "[ Self-Heal ]");
    } catch (e) {
        logger("Bot B is offline or URL is wrong. Could not send report.", "[ Error ]");
    }
}

// Global error listener - Bot ko marnay se pehle report karne deta hai
process.on('uncaughtException', async (err) => {
    logger(`CRITICAL ERROR: ${err.message}`, "[ Crash ]");
    await reportErrorToFixer(err);
    // 5 second ka wait taake report chali jaye, phir process exit karein
    setTimeout(() => { process.exit(1); }, 5000);
});

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

global.countRestart = global.countRestart || 0;

function startBot(message) {
    if (message) logger(message, "[ Starting ]");

    // "Shaan-Khan-K.js" aapki main bot file hai
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Shaan-Khan-K.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0 && global.countRestart < 10) { // Restarts limit thori barha di
            global.countRestart += 1;
            logger(`Bot exited with code ${codeExit}. Restarting... (${global.countRestart}/10)`, "[ Restarting ]");
            
            // Crash par bhi report bhej sakte hain
            startBot();
        } else {
            logger(`Bot stopped permanently. Manual check required.`, "[ Stopped ]");
        }
    });

    child.on("error", (error) => {
        logger(`An error occurred in child process: ${error.message}`, "[ Error ]");
    });
};

// Start the bot
startBot();
