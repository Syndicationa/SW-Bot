const { db } = require('../firebase');
const { updateIncome } = require('./functions');

let database;

const getDatabase = async () => {
    const collections = await db.listCollections();
    const data = collections.map((c) => c.id).reduce(async (acc, val) => {
        const databaseInfo = await db.collection(val).get()
        const data = {}
        databaseInfo.forEach((faction) => data[faction.id] = faction.data());
        return {...acc, [val]: data}
    },{})
    console.log("Retrieved Database")
    return data;
}

const setDatabase = async () => database = await getDatabase();

const printDatabase = () => {
    for (server in database) {
        const serverData = database[server];
        console.log(`${server}:\n`)
        for (faction in serverData) {
            console.log(`Faction: ${faction}`)
            console.log(serverData[faction]);
        }
    }
};

const getFaction = async (server, faction) => {
    if (database !== undefined) {
        return database[server][faction.toLowerCase()];
    }
    const document = await db.collection(server).doc(faction.toLowerCase()).get();
    return document.data();
}

const getFactionNames = (server, f = () => true) => {
    const serverData = database[server];
    return Object.keys(serverData).filter((faction) => f(faction, serverData[faction]));
}

const setFaction = (server, faction, newData) => {
    database[server][faction.toLowerCase()] = {...database[server][faction.toLowerCase()],...newData};
    db.collection(server).doc(faction.toLowerCase()).update(newData);
}

const createFaction = (server, faction, data) => {
    database[server][faction.toLowerCase()] = data;
    db.collection(server).doc(faction.toLowerCase()).set(data);
}

const deleteFaction = (server, faction) => {
    if (faction.toLowerCase() === "settings") return;
    delete database[server][faction.toLowerCase()]
    db.collection(server).doc(faction.toLowerCase()).delete();
}

const claimPlace = (server, place, count) => {
    const settings = database[server].settings;
    const doc = db.collection(server).doc("settings");

    settings.Places[place].Claimed += count;

    doc.set(settings);
}

const deletePlace = (server, place) => {
    const serverData = database[server];
    const serverDB = db.collection(server);
    
    const factionNames = Object.keys(serverData);
    factionNames.forEach((faction) => {
        if (faction === "settings") return;
        const factionData = serverData[faction];

        const zeroedMap = {...factionData.Maps, [place]: 0};
        const newIncome = updateIncome(factionData, zeroedMap, serverData.settings.Places);

        delete factionData.Maps[place];
        serverData[faction] = {...factionData, Income: newIncome}
        serverDB.doc(faction).update({Maps: factionData.Maps, Income: newIncome})
    })

    delete serverData.settings.Places[place];
    serverData.settings.PlaceList = serverData.settings.PlaceList.filter((name) => name !== place); 

    serverDB.doc("settings").set(serverData.settings);
}

module.exports = {getFaction, getFactionNames, setDatabase, setFaction, printDatabase, createFaction, claimPlace, deleteFaction, deletePlace}

const run = async () => {
    await setDatabase();
    printDatabase();

    const er = {afgc: 1321400000000 + 255000000000,
        arestika: 40000000 + (168515000000 * 2),
        athena: 3836393999958,
        daf: 4412723499998,
        demterra: 1256628000000,
        enclave: 6469450000000,
        est: 4114679000000,
        hausteria: 3795449999960,
        jovian: 5155474787280,
        kkw: 97625000000 + (17225000000 * 2),
        mcr: 29276036964420 + 250000000000,
        milita: 2080920000000 - 70000000000,
        raptoria: 29929931700000 - 150000000000,
        raze: 2337626999769,
        rwg:0,
        scrapiracy: 0,
        solflamme: 0,
        sushihouse: 1679249977865,
        test: 0,
        uefb: 30878152779607,
        uf: 11830000000 + 249600000000,
        void: Infinity
        }

    serverDB = database["The Solar Wars"];

    Object.keys(serverDB).forEach((factionName) => {
        const err = er[factionName]
        if (factionName === "settings") return;
        setFaction("The Solar Wars", factionName, 
        {
            Resources: {
                ER: err,
                CM: 0,
                EM: 0,
                NM: 0,
                PM: 0
            }
        })
    })
}
