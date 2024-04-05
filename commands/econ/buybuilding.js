const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { objectMap } = require('../../functions/functions');

const buyLog = log('buy')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "index", description: "Building to be bought", type: "Integer", required: true},
    {name: "location", description: "Where to build the building", type: "String", required: true},
    {name: "amount", description: "Number to be built", type: "String", required: true},
]

const runBuy = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, index, location, amount} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");
    const factionData = await getFaction(server, faction);
    const place = factionData?.Maps[location];
    if (factionData === undefined) {
        error = 'Faction not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (factionData.Buildings[index] === undefined) {
        error = 'Building not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (settings.Places[location] === undefined) {
        error = 'Location not found';
        buyLog({arguments, error});
        await interaction.reply(error);
    } else if (place === undefined || place.Hexes === 0) {
        error = "No hexes in place";
        buyLog({arguments, error});
        await interaction.reply(error);
    } else if (place.Hexes < place.Buildings.reduce((a, b) => a + b, 0)) {
        error = "Not enough hexes";
        buyLog({arguments, error});
        await interaction.reply(error);
    }

    const costs = objectMap(factionData.Buildings[index], (n) => n*amount);

    const NaNCosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNCosts || !isValidType || costs === undefined) {
        error = 'Error in cost';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;
    const newResources = {};

    costs.forEach(async (cost) => {
        const resourceName = cost[1]
        const amount = cost[0]
        const nVal = resources[resourceName] - amount;
        
        if (nVal < 0) {
            error = 'Not enough funds';
            buyLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newResources[resourceName] = nVal;
    })

    if (Object.keys(newResources).length !== Object.keys(costs).length) return;

    const newMaps = {
        ...factionData.Maps,
        [location]: {
            Fleets: [],
            Hexes: 0,
            ...(place ?? {}),
            Buildings: [
                ...place.Buildings.slice(0, index), 
                place.Buildings[index] + amount,
                ...place.Buildings.slice(index + 1)
            ],
        }
    }



    setFaction(server, faction, {Resources: {...resources, ...newResources}});
    await interaction.reply(
        `${faction} has bought ${items} for $${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('buybuilding').setDescription('Buy Building');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
