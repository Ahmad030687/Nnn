module.exports.config = {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "0.0.1",
    credits: "Ahmad RDX",
    description: "Listen events and add back members"
};

module.exports.run = async({ event, api, Threads, Users }) => {
    let data = (await Threads.getData(event.threadID)).data || {};
    
    // 1. Check karo ke Anti-out ON hai ya nahi
    if (data.antiout == false) return;

    // 2. Agar bot ko khud nikala gaya ho toh ignore karo
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    // 3. Naam nikalna
    const name = global.data.userName.get(event.logMessageData.leftParticipantFbId) || await Users.getNameUser(event.logMessageData.leftParticipantFbId);

    // 4. Check karo ke bande ne KHUD left kiya hai ya kisi ne NIKALA hai
    // Agar author aur leftParticipant dono same hain, matlab banda khud bhaga hai
    if (event.author == event.logMessageData.leftParticipantFbId) {
        
        api.addUserToGroup(event.logMessageData.leftParticipantFbId, event.threadID, (error, info) => {
            if (error) {
                api.sendMessage(`❌ [ RDX ] ${name} ko dubara add nahi kar paya! (Ya toh privacy tight hai ya bot friend nahi hai)`, event.threadID);
            } else {
                api.sendMessage(`🔥 [ RDX PRISON ] 🔥\n\nBhag ke jaane ka nahi, ${name} baby! Dekho phir se add kar diya aapko.`, event.threadID);
            }
        });
    }
}
