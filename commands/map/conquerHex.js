const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { db } = require('../../firebase');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { getFaction, setFaction, claimPlace } = require('../../functions/database');
const { log } = require('../../functions/log');
const { objectReduce } = require('../../functions/functions');

const conquerLog = log('conquer');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
	{name: "enemy", description: "Name of the Faction", type: "String", required: true},
	{name: "alliedrpi", description: "total raw power indexes of your side of the war", type: "String", required: true},
	{name: "enemyrpi", description: "total raw power index of this enemy's side of the war", type: "String", required: true},
    {name: "place", description: "Place Hexes are found onto, use none if just checking", type: "String", required: true},
    {name: "count", description: "Count of Hexagons", type: "Integer", required: true},
]

const runconquer = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, enemy, alliedrpi, enemyrpi, place, count} = arguments;

    let error = '';
    const server = interaction.guild.name;
    
    const settings = await getFaction(server, "Settings");

    const placeData = settings.Places[place]
    
   

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        conquerLog({arguments, error});
        await interaction.reply(error);
        return;
    }
	
	const enemyData = await getFaction(server, enemy);
    if (enemyData === undefined) {
        error = 'Faction not found';
        conquerLog({arguments, error});
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
	
	const newEMaps = {
        ...factionData.Maps, 
        [place]: {
            Buildings: [],
            Fleets: [],
            ...(factionData.Maps[place] ?? {}),
            Hexes: (factionData.Maps[place]?.Hexes ?? 0) - count,
        }
    };

	const resources = factionData.Resources;
	const capacities = factionData.Capacities;
	const Ecapacities = enemyData.Capacities;
	const Eresources = enemyData.Resources;
	const newCapacities = {};
	const newECapacities = {};
    const newResources = {};
	const newEResources = {};
	const nVal = Math.round((((10*alliedrpi)*(10*alliedrpi))/((10*enemyrpi)*(10*enemyrpi)))*10*count);
	if (place == 'none')
	{
		await interaction.reply(`${faction} needs ${nVal} Influence to conquer ${count} hex on ${place} from ${enemy}`);
	}
	else
	{
		newECapacities[`PB`] = Ecapacities[`PB`] - count;
		
		newCapacities[`PB`] = capacities[`PB`] + count;
		newResources[`Influence`] = resources[`Influence`] - nVal;
		
		if (newResources[`Influence`] < 0) {
        error = 'Not enough Influence';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
		}
		
		setFaction(server, enemy, {Capacities: {...Ecapacities, ...newECapacities}});
		setFaction(server, faction, {Capacities: {...capacities, ...newCapacities}});
		setFaction(server, faction, {Resources: {...resources, ...newResources}});
		setFaction(server, faction, {Maps: newMaps});
		setFaction(server, enemy, {Maps: newEMaps});
		await interaction.reply(`${faction} conquered ${count} hex on ${place} from ${enemy}, for ${nVal} Influence`);
	}
    
	
	
	

	
	
	
    
}

const command = new SlashCommandBuilder().setName('conquer').setDescription('conquer Hexagons');
generateInputs(command, inputs);

const conquer = {
    data: command,
    execute: runconquer
}

module.exports = conquer;
