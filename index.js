const { spawn } = require("child_process");
const axios = require("axios");
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Dashboard setup (Uptime ke liye)
app.get('/', (req, res) => {
    res.send('Mano Bot is running and protected by Bot B!');
});

app.listen(port, () => {
    console.log(`[ SERVER ] Running on port ${port}`);
});

///////////////////////////////////////////////////////////
//========= 🛡️ DYNAMIC SELF-HEALING SYSTEM =========//
///////////////////////////////////////////////////////////

// Aapka Bot B ka URL (Fixer Link)
const BOT_B_URL = "https://auto-fixer-bot-b.onrender.com/fix"; 

async function reportErrorToFixer(err) {
    try {
        // Error stack se crash hone wali file ka naam nikalna
        const stackLines = err.stack.split('\n');
        const callerLine = stackLines.find(line => line.includes('modules/commands'));
        
        let targetFile = "";
        if (callerLine) {
            const match = callerLine.match(/(modules\/commands\/.*?\.js)/);
            if (match) targetFile = match[1];
        }

        // Agar file nahi mili toh default jail.js (Test ke liye)
        if (!targetFile) targetFile = "modules/commands/jail.js";

        const filePath = path.join(__dirname, targetFile);
        
        if (fs.existsSync(filePath)) {
            const codeContent = fs.readFileSync(filePath, "utf8");
            
            console.log(`[ SELF-HEAL ] Detected crash in: ${targetFile}`);
            console.log(`[ SELF-HEAL ] Sending SOS to Bot B...`);

            await axios.post(BOT_B_URL, {
                error: err.message,
                stack: err.stack,
                filename: targetFile,
                code: codeContent
            });
            
            console.log(`[ SUCCESS ] Report sent! Bot B is fixing it now.`);
        }
    } catch (e) {
        console.log("[ ERROR ] Bot B tak signal nahi pahunch saka. URL ya Network check karein.");
    }
}

// Ye listener bot ke har "Janaza" (Crash) ko monitor karega
process.on('uncaughtException', async (err) => {
    console.error(`[ CRASH ] Critical Error: ${err.message}`);
    await reportErrorToFixer(err);
    // 5 seconds wait taake signal chala jaye, phir bot band ho
    setTimeout(() => { process.exit(1); }, 5000);
});

/////////////////////////////////////////////////////////
//========= BOT PROCESS MANAGEMENT =========//
/////////////////////////////////////////////////////////

function startBot() {
    // Child process jo aapke bot (Shaan-Khan-K.js) ko chalayega
    const child = spawn("node", ["--trace-warnings", "Shaan-Khan-K.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0) {
            console.log(`[ RESTART ] Bot crashed. Restarting in 10s...`);
            // Bot B ko code theek karne ka waqt dene ke liye 10 sec delay
            setTimeout(startBot, 10000);
        }
    });
}

startBot();
