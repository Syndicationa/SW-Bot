const { SlashCommandBuilder } = require('discord.js');
const { getFactionNames, getFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { generateInputs, retrieveInputs } = require('../../functions/createInputs');
const { objectReduce } = require('../../functions/functions');

const inputs = [
    {name: "location", description: "Place to find factions", type: "String", required: true}
]

const command = new SlashCommandBuilder().setName('owners').setDescription('Get Nations on Location');
generateInputs(command, inputs)

const nationLog = log('owners');

const countOnPlanet = (factionData, place) => {
    const Maps = factionData.Maps;
    if (Maps === undefined || Maps[place] === undefined) return 0;
    return Maps[place].Hexes;
};

const valid = place => (_, data) => countOnPlanet(data, place) > 0;

const getHexCounts = place => (name, factionData) => {
    return `${name}: ${countOnPlanet(factionData, place)}`;
}

const runOwners = async (interaction) => {
    const {location} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;
    const settings = await getFaction(server, "Settings");

    if (settings.Places[location] === undefined) {
        error = 'Place not found';
        nationLog({arguments, error});
        await interaction.reply(error);
        return;
    }
        
    const factions = getFactionNames(server, valid(location), (name, data) => [name, data.Maps[location].Hexes]);
    const [longestName, longestNumber, total] = factions.reduce(([lname, lnum, a], [name, c]) => {
        return [Math.max(lname, name.length), Math.max(lnum, c.toString().length), a + c]
    }, [0,0,0]);

    const string = factions.map(([name, c]) => {
        return name.padEnd(longestName + 1) + c.toString().padStart(longestNumber);
    }).join("\n");

    const claimed = settings.Places[location].Claimed;
    const size = settings.Places[location].Size
    await interaction.reply(`${location} has \nFactions: \`\`\`${string}\`\`\` making ${total}/${size} hexagons. ${claimed} = ${total}?`);
};

const nations = {
    data: command,
    execute: runOwners
}

module.exports = nations;
