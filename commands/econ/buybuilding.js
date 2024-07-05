const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { objectMap, objectReduce } = require('../../functions/functions');
const { getFactionStats } = require('../../functions/income');
const { countBuildings, scaleResources, subResources, minResources, maxResources, equResources, roundResources, buildingCost } = require('../../functions/incomeMath');

const buyLog = log('buy')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "index", description: "Building to be bought", type: "Integer", required: true},
    {name: "location", description: "Where to build the building", type: "String", required: true},
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
    } else if (factionData.Buildings[index] === undefined) {
        error = 'Building not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (settings.Places[location] === undefined) {
        error = 'Location not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (place === undefined || place.Hexes === 0) {
        error = "No hexes in place";
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (place.Hexes < place.Buildings.reduce((a, b) => a + countBuildings(b), 0)) {
        error = "Not enough hexes";
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const costs = buildingCost(factionData, index, amount);

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

    const oldBuilding = place.Buildings[index] ?? {};

    const newBuilding = {
        ...oldBuilding,
        "0": (oldBuilding["0"] ?? 0) + amount
    }

    const newBuildings = place.Buildings;
    newBuildings[index] = newBuilding;

    const newMaps = {
        ...factionData.Maps,
        [location]: {
            Fleets: [],
            Hexes: 0,
            ...(place ?? {}),
            Buildings: Array.from(newBuildings, (l) => l ?? null),
        }
    }

    const tFaction = {...factionData, Resources: {...resources, ...newResources}, Maps: newMaps};
    const stats = getFactionStats(settings, tFaction);

    setFaction(server, faction, {Resources: {...resources, ...newResources}, Maps: newMaps, ...stats});
    await interaction.reply(
        `${faction} has bought ${amount} ${factionData.Buildings[index].name} for ${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('buybuilding').setDescription('Buy Building');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
