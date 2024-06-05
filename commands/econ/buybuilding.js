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

    const costs = objectMap(factionData.Buildings[index].cost, (n) => n*amount);

    const NaNCosts = Object.keys(costs).some((res) => isNaN(costs[res]));
    if (NaNCosts || costs === undefined) {
        error = 'Error in cost';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;
    
    const newResources = 
        objectMap(resources,
            (count, res) => {
            const nVal = count - costs[res];
            
            if (count >= 0 && nVal < 0 && error === "") {
                error = 'Not enough funds';
            }

            return nVal;
        })

    if (error !== "") {
        buyLog({arguments, error});
        await interaction.reply(error);
    }

    if (Object.keys(newResources).length !== Object.keys(costs).length) return;

    const oldBuilding = place.Buildings[index] ?? {};

    const newBuilding = {
        ...oldBuilding,
        "0": (oldBuilding["0"] ?? 0) + 1
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

    console.log(newResources);

    setFaction(server, faction, {Resources: {...resources, ...newResources}});
    setFaction(server, faction, {Maps: newMaps});
    await interaction.reply(
        `${faction} has bought ${amount} ${factionData.Buildings[index].name} for $${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('buybuilding').setDescription('Buy Building');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
