const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { db } = require('../../firebase');
const { getFaction, setFaction, claimPlace } = require('../../functions/database');
const { log } = require('../../functions/log');
const { subResources } = require('../../functions/resourceMath');

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

    if (placeData.Claimed + count > placeData.Size) {
        error = 'Too many hexes were claimed';
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

    const resources = factionData.Resources;
	const newResources = subResources(resources, {Influence: Math.abs(count*20)})
    if (newResources.Influence < 0) {
        error = 'Not enough Influence';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newMaps = {
        ...factionData.Maps, 
        [place]: {
            Buildings: [],
            Fleets: [],
            ...(factionData.Maps[place] ?? {}),
            Hexes: (factionData.Maps[place]?.Hexes ?? 0) + count,
        }
    };

	setFaction(server, faction, {Resources: newResources});
    setFaction(server, faction, {Maps: newMaps});
    claimPlace(server, place, count);
    await interaction.reply(`${faction} has claimed ${count} on ${place}`);
}

const command = new SlashCommandBuilder().setName('claim').setDescription('Claim Hexagons');
generateInputs(command, inputs);

const claim = {
    data: command,
    execute: runClaim
}

module.exports = claim;
