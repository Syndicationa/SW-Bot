const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { objectMap, objectReduce } = require('../../functions/functions');
const { getFactionStats } = require('../../functions/income');
const { countBuildings, scaleResources, subResources, maxResources, equResources, roundResources } = require('../../functions/resourceMath');
const { buildingCost } = require('../../functions/incomeMath');

const buyLog = log('buy')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "index", description: "Vehicle to be bought", type: "Integer", required: true},
    {name: "location", description: "Where to place the Vehicle", type: "String", required: true},
    {name: "amount", description: "Number to be built", type: "Integer", required: true},
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
    } else if (factionData.Vehicles[index] === undefined) {
        error = 'Building not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (settings.Places[location] === undefined) {
        error = 'Location not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const vehicle = factionData.Vehicles[data];

    const costs = scaleResources(vehicle.cost, amount);

    const NaNCosts = Object.keys(costs).some((res) => isNaN(costs[res]));
    if (NaNCosts || costs === undefined) {
        error = 'Error in cost';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;

    const newResources = roundResources(subResources(resources, costs));
    const newRes0 = maxResources(newResources);

    if (!equResources(newResources, newRes0)) {
        error = 'Not enough funds';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newVehicle = {
        ...vehicle,
        count: vehicle.count + amount
    };

    const newVehicles = placeVehicless;
    newVehicles[index] = newVehicle;

    const newFactionData = {...factionData, Resources: {...resources, ...newResources}, Vehicles: newVehicles};

    setFaction(server, faction, newFactionData);
    await interaction.reply(
        `${faction} has bought ${amount} ${vehicle.name} for ${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('buy-vehicle').setDescription('Buy Vehicle');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
