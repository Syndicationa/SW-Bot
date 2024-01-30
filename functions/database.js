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

const run = async () => {
    await setDatabase();
    printDatabase();

    const er = {'11': 17678500000,
		'5th empire': 50000000000,
		afgc: 13491000000,
        arestika: 1471203334000,
        athena: 2789501000000,
        daf: 4412723499998,
        demterra: 5664627999000,
		dummy: 0,
		enclave: 0,
        est: 4727494999960,
		gh: 50000000000,
        hausteria: 14061620499960,
        jovian: 8367112437280,
        kkw: 151188999990,
		lter: 59513200000,
        mcr: 28877851928603,
        milita: 11380910000000,
		'new spain': 50000000000,
		'nexus federation': 57994000000,
		piratetest: 0,
        raptoria: 20279931700000,
        raze: 8942026999669,
        rwg:0,
        scrapiracy: 0,
        solflamme: 0,
        sushihouse: 1122500000000,
		tank: 50000000000,
		tempestas: 53249977877,
        test: 0,
        uefb: 28651252779607,
        uf: 1290158000001,
        void: Infinity,
		wingyu687: 50000000000
        }
	const ir = {'11': 19167000000,
		'5th empire': 5000000000,
		afgc: 0,
        arestika: 250000000000,
        athena: 250000000000,
        daf: 135685000000,
        demterra: 250000000000,
		dummy: 54200000000,
		enclave: 0,
        est: 250000000000,
		gh: 5000000000,
        hausteria: 250000000000,
        jovian: 250000000000,
        kkw: 250000000000,
		lter: 5000000000,
        mcr: 250000000000,
        milita: 250000000000,
		'new spain': 5000000000,
		'nexus federation': 24800000000,
		piratetest: 0,
        raptoria: 250000000000,
        raze: 250000000000,
        rwg:5000000000,
        scrapiracy: 250000000000,
        solflamme: 250000000000,
        sushihouse: 250000000000,
		tank: 35000000000,
		tempestas: 94400000000,
        test: 5000000000,
        uefb: 250000000000,
        uf: 250000000000,
        void: Infinity,
		wingyu687: 5000000000
        }
	
    serverDB = database["The Solar Wars"];

    Object.keys(serverDB).forEach((factionName) => {
        const err = er[factionName];
		console.log(err);
		const irr = ir[factionName];
        if (factionName === "settings") return;
        setFaction("The Solar Wars", factionName, 
        {
            Resources: {
                ER: err,
                cm: [0,0],
                electronics: [0,0],
                consumables: [0,0],
				influence: [0,0],
				'unrefined cm': [0,0],
				'unrefined consumables': [0,0],
				'unrefined electronics': [0,0]

            }, 
			Income: {
                ER: irr,
                cm: 0,
                electronics: 0,
                consumables: 0,
				influence: 0,
				'unrefined cm': 0,
				'unrefined consumables': 0,
				'unrefined electronics': 0
            },
			MissionSlots: {
				1: [0,0,0,0],
				2: [0,0,0,0],
				3: [0,0,0,0],
				4: [0,0,0,0],
				5: [0,0,0,0],
			},
        })
		
    })
}

module.exports = {getFaction, getFactionNames, setDatabase, setFaction, printDatabase, createFaction, claimPlace, deleteFaction, deletePlace, run}


