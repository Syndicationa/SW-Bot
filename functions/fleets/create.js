const {getFaction, setFaction} = require("../../functions/database");
const { generateNextID, makeAGroup } = require("./group");
const { isValidLocation } = require('./travel');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "name", description: "Fleet Name", type: "String", required: true},
    {name: "location", description: "Location", type: "String", required: true}
]

const createFleet = async (server, {faction, name, location}) => {
    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        throw "Faction data not found!"
    }

    if (!isValidLocation(location)) {
        throw "Not valid location!";
    }

    const newID = generateNextID(factionData.Fleets);

    const newFleets = [
        ...factionData.Fleets,
        makeAGroup(name, newID, "Space", location)
    ]

    setFaction(server, faction, {Fleets: newFleets});
    
    return `${faction} has formed the ${name} at ${location}`;
}

module.exports = {inputs, createFleet};