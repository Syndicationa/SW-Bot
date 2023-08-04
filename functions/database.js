const { db } = require('../firebase');

const getFaction = async (server, faction) => {
    const document = await db.collection(server).doc(faction.toLowerCase()).get();
    return document.data();
}

const setFaction = (server, faction, newData) => 
    db.collection(server).doc(faction.toLowerCase()).update(newData);

module.exports = {getFaction, setFaction}