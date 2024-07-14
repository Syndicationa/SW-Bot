const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { objectMap } = require('../../functions/functions');
const { calculateCapacities, countBuildings, scaleResources, maxResources, subResources, equResources, roundResources } = require('../../functions/incomeMath');
const { getFactionStats } = require('../../functions/income');

const buyLog = log('buy')

const sumCT = (c, t) => (t*(t+1)-c*(c+1))/2;

const countBelowLevel = (building = {}, level) => {
    let sum = 0;
    for (let x = 0; x < level; x++) sum += building[x] ?? 0;
    console.log(sum);
    return sum;
};

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "index", description: "Building to be bought", type: "Integer", required: true},
    {name: "location", description: "Where to build the building", type: "String", required: true},
    {name: "level", description: "Level to upgrade to", type: "Integer", required: true},
]

const runBuy = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, index, location, level: lvl} = arguments;
    const level = lvl - 1;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");
    const factionData = await getFaction(server, faction);
    const place = factionData?.Maps[location];
    const buildings = place?.Buildings[index];
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
    } else if (buildings === undefined || countBelowLevel(buildings, level) === 0) {
        error = "No upgradable buildings";
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (level <= 0 || level > 9) {
        error = "Cannot upgrade to that level";
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const originalLevel = Number(Object.keys(buildings).filter(str => Number(str) < level && buildings[str] > 0).reverse()[0]);

    const costs = roundResources(scaleResources(factionData.Buildings[index].cost, sumCT(originalLevel, level)));

    const NaNCosts = Object.keys(costs).some((res) => isNaN(costs[res]));
    if (NaNCosts || costs === undefined) {
        error = 'Error in cost';
        console.log(costs);
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;

    const newResources = roundResources(subResources(resources, costs));
    const newRes0 = maxResources(newResources);

    if (!equResources(newResources, newRes0)) {
        error = 'Not enough funds';
        console.log(costs);
        console.log(newResources);
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newBuilding = {
        ...buildings,
        [originalLevel]: buildings[originalLevel] - 1,
        [level]: (buildings[level] ?? 0) + 1
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
        `${faction} has upgraded a lvl ${originalLevel + 1} ${factionData.Buildings[index].name} to lvl ${level + 1} for ${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('upgrade-building').setDescription('Upgrade Building');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
