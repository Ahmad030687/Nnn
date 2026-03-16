const { spawn } = require("child_process");
const axios = require("axios");
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Dashboard for Uptime
app.get('/', (req, res) => {
    res.send('Mano Bot (Full Scan Mode) is LIVE! 🛡️🚑');
});

app.listen(port, () => {
    console.log(`[ SERVER ] Dashboard running on port ${port}`);
});

///////////////////////////////////////////////////////////
//========= 🛡️ SMART ERROR REPORTER (BOT A) =========//
///////////////////////////////////////////////////////////

const BOT_B_URL = "https://auto-healer.onrender.com/fix-it"; 

async function reportErrorToFixer(err) {
    try {
        const stackLines = err.stack.split('\n');
        // Commands folder dhoondne ka logic
        const callerLine = stackLines.find(line => line.includes('commands'));
        
        let targetFile = "";
        if (callerLine) {
            // Ye regex 'Priyansh/commands/file.js' ya 'modules/commands/file.js' dono pakar leta hai
            const match = callerLine.match(/((?:Priyansh\/)?(?:modules\/)?commands\/.*?\.js)/);
            if (match) targetFile = match[1];
        }

        // Agar stack trace se kuch na miley toh default jail.js
        if (!targetFile) targetFile = "Priyansh/commands/jail.js";

        // File path set karein
        let filePath = path.join(__dirname, targetFile);
        
        // Agar file exist nahi karti toh check karein ke kya wo Priyansh folder mein hai
        if (!fs.existsSync(filePath)) {
            const possiblePaths = [
                path.join(__dirname, "Priyansh", "commands", path.basename(targetFile)),
                path.join(__dirname, "modules", "commands", path.basename(targetFile))
            ];
            
            for (let p of possiblePaths) {
                if (fs.existsSync(p)) {
                    filePath = p;
                    targetFile = p.replace(__dirname + "/", "");
                    break;
                }
            }
        }

        if (fs.existsSync(filePath)) {
            const codeContent = fs.readFileSync(filePath, "utf8");
            
            console.log(`[ CRASH DETECTED ] File: ${targetFile}`);
            console.log(`[ SOS ] Sending full report to Bot B...`);

            await axios.post(BOT_B_URL, {
                error: err.message,
                stack: err.stack,
                filename: targetFile,
                code: codeContent
            });
            
            console.log(`[ SUCCESS ] SOS Sent! Bot B will fix ${targetFile} now.`);
        } else {
            console.log(`[ ERROR ] Could not locate the crashing file: ${targetFile}`);
        }
    } catch (e) {
        console.log("[ ERROR ] Bot B offline hai ya URL ka masla hai.");
    }
}

// Global Exception Handler
process.on('uncaughtException', async (err) => {
    console.error(`[ BOT CRASHED ] : ${err.message}`);
    await reportErrorToFixer(err);
    // 5 second ka wait taake request chali jaye
    setTimeout(() => { process.exit(1); }, 5000);
});

/////////////////////////////////////////////////////////
//========= BOT PROCESS MANAGEMENT =========//
/////////////////////////////////////////////////////////

function startBot() {
    // Child process jo bot ko run karega
    const child = spawn("node", ["--trace-warnings", "Shaan-Khan-K.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0) {
            console.log(`[ RESTARTING ] Bot is down. Waiting for Surgery (10s)...`);
            // Bot B ko file update karne ke liye 10 sec ka gap dein
            setTimeout(startBot, 10000);
        }
    });
}

// Bot shuru karein
startBot();
