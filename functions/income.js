const { Timestamp } = require('firebase-admin/firestore');
const {getServers, getFaction, getFactionNames, setFaction, getFactions} = require('./database');
const { defaultResources } = require('./currency');
const { calculateIncome, calculateCapacities, performIncome } = require('./incomeMath');
const { addResources, maxResources, minResources } = require('./resourceMath');
const { objectMap } = require('./functions');

const incomePeriod = (5 * 24 * 60 * 60 * 1000);

const updateDate = (LastUpdated = new Date()) => {
	const today = new Date();
	const incomePeriods = Math.floor((today - LastUpdated) / incomePeriod);
	const updateDay = new Date(LastUpdated.getTime() + incomePeriods*incomePeriod);

	return {incomePeriods, date: updateDay};
};

const getFactionStats = (settings, faction) => {
    const blankSto = defaultResources(settings.Storage);
    const blankCap = defaultResources(settings.Capacities);

    return calculateCapacities(faction, settings.Places, blankSto, blankCap);
};

const income = async (server) => {
    console.log(`Performing Income: ${server}`)
    const factionData = getFactions(server);

    if (factionData === undefined) {
        throw Error("Server not found!");
    }

    const lastDate = factionData.data.date.toDate();

    const {incomePeriods, date: newDate} = updateDate(lastDate);
    
    console.log(incomePeriods);
    if (incomePeriods < 1) return;
    if (incomePeriods > 1) throw Error(`Please check ${server} in the database`);

    const newFactionData = performIncome(factionData);
    const newTimestamp = Timestamp.fromDate(newDate);

    objectMap(newFactionData, (data, faction) => {
        if (faction === "settings") return;
        if (faction === "data") setFaction(server, faction, {...data, date: newTimestamp});
        else setFaction(server, faction, data);
        return;
    })
}

const collectIncome = () => {
    const servers = getServers();
    servers.forEach((serverName) => {
        income(serverName);
    })
}

module.exports = {income, collectIncome, getFactionStats};