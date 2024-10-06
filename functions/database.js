const { db } = require('../firebase');
const { minResources, maxResources, addResources, subResources, validResources} = require('./resourceMath');
const { calculateIncome } = require('./incomeMath');

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

const getServers = () => Object.keys(database);

const getFactionNames = (server, f = () => true, addData = a => a) => {
    const serverData = database[server];
    return Object.keys(serverData)
                .filter((faction) => f(faction, serverData[faction]))
                .map((name) => addData(name, serverData[name]));
}

const getFactions = (server) => database[server];

const setFaction = (server, faction, newData) => {
    database[server][faction.toLowerCase()] = {...database[server][faction.toLowerCase()],...newData};
    db.collection(server).doc(faction.toLowerCase()).update(newData);
}

const createFaction = (server, faction, data) => {
    database[server][faction.toLowerCase()] = data;
    db.collection(server).doc(faction.toLowerCase()).set(data);
}

const deleteFaction = (server, faction) => {
    if (faction.toLowerCase() === "settings" || faction.toLowerCase() === "name") return;
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
        if (faction === "settings" || faction === "data") return;
        const factionData = serverData[faction];

        const zeroedMap = {...factionData.Maps, [place]: 0};
        const newIncome = calculateIncome(factionData, zeroedMap, serverData.settings.Places);

        delete factionData.Maps[place];
        serverData[faction] = {...factionData, Income: newIncome}
        serverDB.doc(faction).update({Maps: factionData.Maps, Income: newIncome})
    })

    delete serverData.settings.Places[place];
    serverData.settings.PlaceList = serverData.settings.PlaceList.filter((name) => name !== place); 

    serverDB.doc("settings").set(serverData.settings);
}

module.exports = {getFaction, getServers, getFactionNames, getFactions, setDatabase, setFaction, printDatabase, createFaction, claimPlace, deleteFaction, deletePlace};

const fs = require('node:fs');
const FirebaseFirestore = require("@google-cloud/firestore");
const { defaultResources, splitCurrency, convertToObject } = require('./currency');
const buildings = require("../buildings");
const { Timestamp } = require('firebase-admin/firestore');
const { getFactionStats } = require('./income');
const { split } = require('./functions');

const file = "./database/database20.txt"

const run = async () => {
    await setDatabase();
    
    const fileName = file
    fs.appendFile(fileName, JSON.stringify(database), (e) => {console.log(e)});

    printDatabase();
}

const addData = async () => {
    await setDatabase();
    createFaction("The Solar Wars", "Data", {
        Pacts: {
            Active: [],
            Pending: []
        },
        Wars: {
            Active: [],
            Pending: []
        },
        Trades: {
            Active: [],
            Pending: []
        },
    })
}

const saveToDatabase = async () => {
    await setDatabase();

    const data = fs.readFileSync(file, "utf8", () => {});
    const database = JSON.parse(data);

    // const str = "206b 413k CM 207k EL 369k CS 40m Population";
    // const res = splitCurrency(str);
    // const resourceObject = convertToObject(database["The Solar Wars"].settings.Resources, res);

    // console.log(resourceObject);

    for (server in database) {
        for (faction in database[server]) {
            const data = database[server][faction]
            if (faction === "settings") {
                // createFaction(server, faction, data);
                continue;
            } else if (faction === "data") {
                const {_seconds, _nanoseconds} = data.date;
                const date = new Timestamp(_seconds, _nanoseconds);
                createFaction(server, faction, {...data, date});
                continue;
            }

            // const caps = data.Capacities;
            // const [unrefined, refined, unique] = split(Object.keys(caps));

            // const unrefinedCaps = unrefined.reduce((acc, name) => {return {...acc, [name.slice(2)]: caps[name]}},{});
            // const refinedCaps = refined.reduce((acc, name) => {return {...acc, [name]: caps[name]}}, {});

            // const net = subResources(refinedCaps, unrefinedCaps);

            // if (!validResources(net)) console.log(`${faction} - CM: ${net.CM} CS: ${net.CS} EL: ${net.EL}`);

            // const Resources = addResources(resourceObject, {ER: data.Resources.ER});
            // const Storage = defaultResources(database[server].settings.Storage);
            // const Capacities = defaultResources(database[server].settings.Capacities);
            // const Buildings = buildings;

            // if (faction === "alaska") {
            //     const Capacities = defaultResources(database[server].settings.Capacities);
            //     createFaction(server, faction, {...data, date, Usages: Capacities});
            //     continue;
            // }

            // const factionInfo = {...data};
            
            // const {Capacities: CapacitiesP, Storage: StorageP} = getFactionStats(database[server].settings, factionInfo);

            // const CapacitiesP = addResources(data.Capacities, {Influence: 0});
            // console.log(CapacitiesP);

            createFaction(server, faction, data);
            // console.log(`Fixing ${faction}`);
        }
    }
    console.log("Hopefully done!")
}

// run();
// addData();
// saveToDatabase();