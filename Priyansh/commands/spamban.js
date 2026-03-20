const num = 5; // Kitni baar spam par ban hoga
const timee = 120; // Kitne seconds ke andar spam count hoga
const name = "\x41\x48\x4d\x41\x44\x20\x52\x44\x58"; // AHMAD RDX
const link = "\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x77\x2e\x66\x61\x63\x65\x62\x6f\x6f\x6b\x2e\x63\x6f\x6d\x2f\x70\x72\x6f\x66\x69\x6c\x65\x2e\x70\x68\x70\x3f\x69\x64\x3d\x36\x31\x35\x37\x37\x36\x33\x31\x31\x33\x37\x35\x33\x37"; // Ahmad's FB Link

module.exports.config = {
  name: "spamban",
  version: "2.0.0",
  hasPermssion: 0,
  credits: name,
  description: `automatically ban users if spam bots ${num} time/${timee}s`,
  commandCategory: "System",
  usages: "x",
  cooldowns: 5
};

module.exports.run = async function ({api, event})  {
  return api.sendMessage(`Automatically ban users if spam ${num} Time/${timee}s`, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ Users, Threads, api, event})  {
  let { senderID, messageID, threadID } = event;
  if (!global.client.autoban) global.client.autoban = {};
  
  if (!global.client.autoban[senderID]) {
    global.client.autoban[senderID] = {
      timeStart: Date.now(),
      number: 0
    }
  };
  
  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  if (!event.body || event.body.indexOf(prefix) != 0) return;
  
  if ((global.client.autoban[senderID].timeStart + (timee*1000)) <= Date.now()) {
    global.client.autoban[senderID] = {
      timeStart: Date.now(),
      number: 0
    }
  }
  else {
    global.client.autoban[senderID].number++;
    if (global.client.autoban[senderID].number >= num) {
      var datathread = (await Threads.getData(event.threadID)).threadInfo;
      var namethread = datathread.threadName;
      const moment = require("moment-timezone");
      const timeDate = moment.tz("Asia/Karachi").format("DD/MM/YYYY HH:mm:ss"); // Timezone set to Karachi
      let dataUser = await Users.getData(senderID) || {};
      let data = dataUser.data || {};
      if (data && data.banned == true) return;
      
      data.banned = true;
      data.reason = `spam bot ${num} time/${timee}s` || null;
      data.dateAdded = timeDate;
      
      await Users.setData(senderID, { data });
      global.data.userBanned.set(senderID, { reason: data.reason, dateAdded: data.dateAdded });
      
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0
      };

      // Ban Message with Hex-Encoded Link
      api.sendMessage("🚫 BANNED BY RDX ENGINE 🚫\n🔗 " + link + "\n🆔 ID: " + senderID + " \n👤 Name: " + dataUser.name + `\n⚠️ Reason: spam bot ${num} time/${timee}s\n\n✔️ Reported to admin bot`, threadID,
    () => {
    var idad = global.config.ADMINBOT;
    for(let ad of idad) {
        api.sendMessage(`😻Spam offenders ${num} Time/${timee}s\n😻Name: ${dataUser.name} \n😻ID: ${senderID}\n😻ID Box: ${threadID} \n😻NameBox: ${namethread} \n😻At the time: ${timeDate}`, 
          ad);
    }
    })
    }
  }
};
