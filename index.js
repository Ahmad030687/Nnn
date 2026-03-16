const { spawn } = require("child_process");
const axios = require("axios");
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Render ko zinda rakhne ke liye Dashboard
app.get('/', (req, res) => {
    res.send('Mano Bot (God Mode Engine) is LIVE! 🛡️🚑');
});

app.listen(port, () => {
    console.log(`[ SERVER ] Dashboard running on port ${port}`);
});

///////////////////////////////////////////////////////////
//========= 🛡️ CRITICAL CRASH REPORTER (BOT A) =========//
///////////////////////////////////////////////////////////

const BOT_B_URL = "https://auto-healer.onrender.com/fix-it"; 

async function reportErrorToFixer(err) {
    try {
        const stackLines = err.stack.split('\n');
        // Check karna ke error 'commands' folder mein hai ya nahi
        const callerLine = stackLines.find(line => line.includes('commands'));
        
        let targetFile = "";
        if (callerLine) {
            // Priyansh folder aur normal commands dono ko support karta hai
            const match = callerLine.match(/((?:Priyansh\/)?(?:modules\/)?commands\/.*?\.js)/);
            if (match) targetFile = match[1];
        }

        // Agar kuch na milay toh default check
        if (!targetFile) targetFile = "Priyansh/commands/jail.js";

        let filePath = path.join(__dirname, targetFile);
        
        // Agar file exist nahi karti toh dhoondna
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
            
            console.log(`[ CRITICAL CRASH ] File: ${targetFile}`);
            console.log(`[ SOS ] Sending report to Surgeon Bot B...`);

            await axios.post(BOT_B_URL, {
                error: err.message,
                stack: err.stack,
                filename: targetFile,
                code: codeContent
            });
            
            console.log(`[ SUCCESS ] SOS Sent! Bot B is fixing the file.`);
        }
    } catch (e) {
        console.log("[ ERROR ] Bot B se rabta nahi ho saka.");
    }
}

// Global Exception Handler - Bot phat-te hi ye chalega
process.on('uncaughtException', async (err) => {
    console.error(`[ BOT CRASHED ] : ${err.message}`);
    await reportErrorToFixer(err);
    // 5 seconds delay taake report chali jaye
    setTimeout(() => { process.exit(1); }, 5000);
});

/////////////////////////////////////////////////////////
//========= BOT PROCESS MANAGEMENT (START) =========//
/////////////////////////////////////////////////////////

function startBot() {
    // Apni main file ka naam check karlein (Shaan-Khan-K.js)
    const child = spawn("node", ["--trace-warnings", "Shaan-Khan-K.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0) {
            console.log(`[ RESTARTING ] Bot down hai. Surgery ka waqt hai (10s)...`);
            // 10 second ka wait taake Bot B file theek kar ke push kar de
            setTimeout(startBot, 10000);
        }
    });
}

// Start the engine
startBot();
