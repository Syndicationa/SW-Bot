const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { Timestamp } = require('firebase-admin/firestore');
const {getFaction, setFaction} = require("../../functions/database");
const { log } = require('../../functions/log');
const { splitCurrency, convertToObject } = require('../../functions/currency');
const { objectMap } = require('../../functions/functions');

const regBLog = log('registerBuidling');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "name", description: "Building Name", type: "String", required: true},
    {name: "cost", description: "Cost of the Building", type: "String", required: true},
    {name: "income", description: "Income generated by the building (number interpreted as a percentage)", type: "String", required: true},
    {name: "year", description: "Date of creation", type: "Integer", required: true},
    {name: "month", description: "Date of creation", type: "Integer", required: true},
    {name: "day", description: "Date of creation", type: "Integer", required: true}
]

const runRegisterBuilding = async (interaction) => {
    const {faction, name, cost, income, year, month, day} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;

    const settings = await getFaction(server, "settings");
    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        regBLog({arguments: {faction}, error: 'Faction not found'})
        await interaction.reply('Faction not found');
        return;
    }
    
    const lastDate = Date.UTC(year, month - 1, day);
    const newDate = new Date(lastDate);
    const newTimestamp = Timestamp.fromDate(newDate);

    const calcCosts = splitCurrency(cost);

    const NaNCosts = calcCosts.some((cost) => isNaN(cost[0]));
    const isValidType = calcCosts.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNCosts || !isValidType || calcCosts === undefined) {
        error = 'Error in cost';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const calcIncomes = splitCurrency(income);

    const NaNIncomes = calcCosts.some((cost) => isNaN(cost[0]));
    const isValidTypeIncome = calcCosts.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNIncomes || !isValidTypeIncome || calcIncomes === undefined) {
        error = 'Error in income';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newBuildings = [
        ...factionData.Buildings,
        {
            date: newTimestamp, name, 
            cost: convertToObject(settings, calcCosts), 
            income: convertToObject(settings, calcIncomes)
        }
    ]

    setFaction(server, faction, {Buildings: newBuildings});
    await interaction.reply(`${faction} has added the ${name} to its buildings`);
}

const command = new SlashCommandBuilder().setName('registerbuidling').setDescription('Register a new buidling');
generateInputs(command, inputs);

const registerbuilding = {
    data: command,
    execute: runRegisterBuilding
}

module.exports = registerbuilding;