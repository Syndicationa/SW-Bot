const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { Timestamp } = require('firebase-admin/firestore');
const {getFaction, setFaction} = require("../../functions/database");
const { log } = require('../../functions/log');
const { splitCurrency } = require('../../functions/currency');
const { generateNextID } = require('../../functions/fleets');

const regVLog = log('registerVehicle');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "name", description: "Vehicle Name", type: "String", required: true},
    {name: "cost", description: "Cost of the Vehcile", type: "String", required: true},
    {name: "year", description: "Date of creation", type: "Integer", required: true},
    {name: "month", description: "Date of creation", type: "Integer", required: true},
    {name: "day", description: "Date of creation", type: "Integer", required: true},
    {name: "count", description: "Starting Count", type: "Integer", required: false, default: 0}
]

const runRegisterVehicle = async (interaction) => {
    const {faction, name, cost, year, month, day, count} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;

    const settings = await getFaction(server, "settings");
    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        regVLog({arguments: {faction}, error: 'Faction not found'})
        await interaction.reply('Faction not found');
        return;
    }
    
    const lastDate = Date.UTC(year, month - 1, day);
    const newDate = new Date(lastDate);
    const newTimestamp = Timestamp.fromDate(newDate);

    const costs = splitCurrency(cost);
    const NaNCosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNCosts || !isValidType || costs === undefined) {
        error = 'Error in amount';
        regVLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const calcCosts = {};

    costs.forEach(async (cost) => {
        const resourceName = cost[1]
        const amount = cost[0]
        const nVal = amount;
        
        if (nVal < 0) {
            error = 'Not enough funds';
            regVLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        calcCosts[resourceName] = nVal;
    })

    const newID = generateNextID(factionData.Vehicles);

    const newVehicles = [
        ...factionData.Vehicles,
        {date: newTimestamp, name, cost: calcCosts, count: count, ID: newID}
    ]

    setFaction(server, faction, {Vehicles: newVehicles});
    await interaction.reply(`${faction} has added the ${name} to its arsenal`);
}

// const command = new SlashCommandBuilder().setName('register-vehicle').setDescription('Register a new vehicle');
// generateInputs(command, inputs);

// const setdate = {
//     data: command,
//     execute: runRegisterVehicle
// }

// module.exports = setdate;