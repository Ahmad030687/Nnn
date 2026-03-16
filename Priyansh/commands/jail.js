module.exports.config = { 
  name: "jail", 
  version: "1.0.0", 
  hasPermission: 0, 
  credits: "Ahmad", 
  description: "test", 
  commandCategory: "system", 
  usages: "", 
  cooldowns: 5 
}; 

module.exports.run = async ({ api, event }) => { 
  const message = "Hello from jail command";
  return api.sendMessage(message, event.threadID); 
};