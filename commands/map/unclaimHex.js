const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { getFaction, setFaction, claimPlace } = require('../../functions/database');
const { log } = require('../../functions/log');
const { countBuildings } = require('../../functions/incomeMath');

const claimLog = log('claim');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "place", description: "Place Hexes are found onto", type: "String", required: true},
    {name: "count", description: "Count of Hexagons", type: "Integer", required: true},
]

const runClaim = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, place, count} = arguments;

    let error = '';
    const server = interaction.guild.name;
    
    const settings = await getFaction(server, "Settings");

    const placeData = settings.Places[place]
    
    if (placeData === undefined) {
        error = 'Place does not exist';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionMap = factionData.Maps[place];

    if (factionMap === undefined) {
        error = 'Map not found';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    } if (factionMap.Hexes < count) {
        error = 'Not enough Hexagons';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (factionMap.Buildings.reduce((a, b) => a + countBuildings(b), 0) > factionMap.Hexes - count) {
        error = 'Too many buildings';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newMaps = {
        ...factionData.Maps, 
        [place]: {
            ...factionMap,
            Hexes: factionMap.Hexes - count,
        }
    };

    setFaction(server, faction, {Maps: newMaps});
    claimPlace(server, place, -count);
    await interaction.reply(`${faction} has unclaimed ${count} on ${place}`);
}

const command = new SlashCommandBuilder().setName('unclaim').setDescription('Remove Hexagons');
generateInputs(command, inputs);

const claim = {
    data: command,
    execute: runClaim
}

module.exports = claim;
