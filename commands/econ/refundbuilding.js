const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { objectMap, objectReduce } = require('../../functions/functions');
const { getFactionStats } = require('../../functions/income');
const { countBuildings, scaleResources, maxResources, equResources, roundResources, addResources } = require('../../functions/resourceMath');
const { buildingScale } = require('../../functions/incomeMath');

const buyLog = log('refund')

const increaseRate = 0.02;
const refundRate = 0.3;

const sumN = n => n*(n+1)/2;
const sumCN = (c, n) => n*(n+2*c-1)/2;

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "index", description: "Building to be sold", type: "Integer", required: true},
    {name: "level", description: "Level to be sold from", type: "Integer", required: true},
    {name: "location", description: "Where to sell the building", type: "String", required: true},
    {name: "amount", description: "Number to be sold", type: "Integer", required: true},
    {name: "week", description: "Has it been less than a week", type: "Boolean", required: false}
]

const runRefund = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, index, level: lvl, location, amount, week} = arguments;
    const level = lvl - 1;
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
    } else if (amount > place.Buildings[index][level]) {
        error = "Not enough buildings";
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const buildingCount = objectReduce(factionData.Maps, (a, p) => a + p.Buildings.reduce((a, b) => a + countBuildings(b), 0),0);

    const scale = buildingScale(buildingCount - amount, amount);

    const costs = roundResources(scaleResources(factionData.Buildings[index].cost, (scale + sumN(level)*amount)*(week ? 1:refundRate)));

    const NaNCosts = Object.keys(costs).some((res) => isNaN(costs[res]));
    if (NaNCosts || costs === undefined) {
        error = 'Error in cost';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;

    const newResources = roundResources(addResources(resources, costs));
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
        [level]: oldBuilding[level] - amount
    }

    const newBuildings = place.Buildings;
    newBuildings[index] = newBuilding;

    const newMaps = {
        ...factionData.Maps,
        [location]: {
            Fleets: [],
            Hexes: 0,
            ...(place ?? {}),
            Buildings: newBuildings,
        }
    }

    const tFaction = {...factionData, Resources: {...resources, ...newResources}, Maps: newMaps};
    const stats = getFactionStats(settings, tFaction);

    setFaction(server, faction, {Resources: {...resources, ...newResources}, Maps: newMaps, ...stats});
    await interaction.reply(
        `${faction} has sold ${amount} ${factionData.Buildings[index].name} for ${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('refundbuilding').setDescription('Refund Building');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runRefund
}

module.exports = buy;
