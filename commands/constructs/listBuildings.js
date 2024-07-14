const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const {getFaction,} = require("../../functions/database");
const { log } = require('../../functions/log');
const { countBuildings } = require('../../functions/incomeMath');

const listBLog = log('registerBuidling');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "location", description: "Place to read buildings", type: "String", required: true}
]

const runListConstructs = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, location} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const factionData = await getFaction(server, faction);
    const place = factionData?.Maps[location];
    const buildings = factionData.Buildings;
    if (factionData === undefined) {
        error = 'Faction not found';
        listBLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (place === undefined) {
        error = 'Location not found';
        listBLog({arguments, error});
        await interaction.reply(error);
    }
    
    const buildingStr = 
        place.Buildings.map(
            (building,i) => 
                `ID: ${i} ${buildings[i].name}: ${countBuildings(building)}`
        ).join("\n ");

    await interaction.reply(
    `${faction} has \nBuildings: \`\`\` ${buildingStr}\`\`\` in ${place.Hexes} hexagons`);
}

const command = new SlashCommandBuilder().setName('list-buildings').setDescription('List a faction\'s buildings in a place');
generateInputs(command, inputs);

const listConstructs = {
    data: command,
    execute: runListConstructs
}

module.exports = listConstructs;