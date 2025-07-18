const fs = require('node:fs');
const { db } = require('../firebase');
const { minResources, maxResources, addResources, subResources, validResources, divResources} = require('./resourceMath');
const { calculateIncome } = require('./incomeMath');

let database;

const getDatabase = async () => {
    const collections = await db.listCollections();
    const database = {};
    
    await Promise.all(collections.map((c) => c.id).map(async (val) => {
        const databaseInfo = await db.collection(val).get()
        const data = {}
        databaseInfo.forEach((faction) => data[faction.id] = faction.data());
        
        database[val] = data;

        return 0;
    }));

    console.log("Retrieved Database")
    return database;
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

const FirebaseFirestore = require("@google-cloud/firestore");
const { defaultResources, splitCurrency, convertToObject } = require('./currency');
const buildings = require("../buildings");
const { Timestamp } = require('firebase-admin/firestore');
const { getFactionStats } = require('./income');
const { scaleResources } = require("./resourceMath");
const { split, objectReduce, objectMap } = require('./functions');

const file = "./database/database48.txt"

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

    for (const server in database) {
        // if (server !== 'The Solar Wars') continue;
        // let runningSum = defaultResources(['ER', 'CM', 'CS', 'EL', 'U-CM', 'U-CS', 'U-EL']);
        // let isActive = new Set();

        // for (const faction in database[server]) {
        //     if (faction === 'settings' || faction === 'data') continue;

        //     if (!('Maps' in database[server][faction])) continue;

        //     const land = objectReduce(database[server][faction].Maps, (a, map) => a + map.Hexes, 0) > 0;

        //     if (!land) continue;
        //     isActive.add(faction);
        //     runningSum = addResources(runningSum, database[server][faction].Resources);
        // }

        // console.log(runningSum);
        // runningSum = scaleResources(runningSum, 1/(isActive.size));
        // runningSum = objectMap(runningSum, (i) => Math.floor(i));
        // console.log(runningSum);

        for (const faction in database[server]) {
            const data = database[server][faction]

            if (faction === "settings") {
                // for (const each in data.Places) {
                //     console.log(each);
                // }
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
            const Buildings = buildings;

            // if (faction === "alaska") {
            //     const Capacities = defaultResources(database[server].settings.Capacities);
            //     createFaction(server, faction, {...data, date, Usages: Capacities});
            //     continue;
            // }

            // const factionInfo = {...data};
            
            // const {Resources, Capacities, Storage} = getFactionStats(database[server].settings, data);

            // const ResourcesP = scaleResources(Resources, 10);
            // const ResourcesP = {
            //     ...Resources,
            //     CM: Resources.CM*10,
            //     CS: Resources.CS*10,
            //     EL: Resources.EL*10,
            //     "U-CM": Resources["U-CM"]*10,
            //     "U-CS": Resources["U-CS"]*10,
            //     "U-EL": Resources["U-EL"]*10,
            // }
            // const CapacitiesP = scaleResources(Capacities, 10);
            // const StorageP = scaleResources(Storage, 10);

            createFaction(server, faction, {...data});
            console.log(`Fixing ${faction}`);
        }
    }
    console.log("Hopefully done!")
}

// run();
// addData();
// saveToDatabase();