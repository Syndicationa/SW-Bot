const { Timestamp } = require('firebase-admin/firestore');
const {getServers, getFaction, getFactionNames, setFaction} = require('./database');
const { defaultResources } = require('./currency');
const { calculateIncome, addResources, maxResources, minResources, calculateCapacities } = require('./incomeMath');

const week = (7 * 24 * 60 * 60 * 1000);

const updateDate = (LastUpdated = new Date()) => {
	const today = new Date();
	const weeks = Math.floor((today - LastUpdated) / week);
	const updateDay = new Date(LastUpdated.getTime() + weeks*week);

	return {weeks, date: updateDay};
};

const getFactionStats = (settings, faction) => {
    const blankRes = defaultResources(settings.Resources);
    const blankCap = defaultResources(settings.Capacities);

    const {Storage, Capacities} = calculateCapacities(faction, settings.Places, blankRes, blankCap);
    return {Storage, Capacities};
};

const income = async (server, faction) => {
    if (faction.toLowerCase() === "settings") {
        const factionData = await getFaction(server, faction.toLowerCase());
        const places = Object.keys(factionData.Places).sort();
        places.forEach((place) => console.log(`${place}: ${factionData.Places[place].Size}`))
        return;
    }

    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        throw Error("Faction not found!");
    }

    const resources = factionData.Resources;
    const lastDate = factionData.date.toDate();

    const {weeks, date: newDate} = updateDate(lastDate);
    
    // console.log(faction, weeks);
    if (weeks <= 0 || faction !== "dummy") return;
    if (weeks > 1) throw Error(`Please check ${faction} in the database`);

    console.log(`Collecting income for ${faction}`);

    const income = calculateIncome(factionData);
    const newResources = addResources(resources, income);
    const cappedResources = maxResources(minResources(newResources, factionData.Storage));

    const newTimestamp = Timestamp.fromDate(newDate);
    setFaction(server, faction, {Resources: cappedResources, date: newTimestamp});
}

const collectIncome = () => {
    const servers = getServers();
    servers.forEach((serverName) => {
        const factions = getFactionNames(serverName);
        factions.forEach((factionName) => {
            income(serverName, factionName);
        })
    })   
}

module.exports = {income, collectIncome, getFactionStats};