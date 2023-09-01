const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency } = require('../../functions/currency');
const { getFaction, createFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { Timestamp } = require('firebase-admin/firestore');

const createLog = log('create');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "treasury", description: "The amount of funds (m,b,t)", type: "String", required: false},
    {name: "income", description: "The amount of weekly income", type: "String", required: false},
]

const runCreate = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const treasury = arguments.treasury ?? "50b";
    const income = arguments.income ?? "5b";

    let error = '';
    const server = interaction.guild.name;
    
    const value = handleCurrency(treasury);
    const inc = handleCurrency(income);
    if (isNaN(value) || value === undefined ||
        isNaN(inc) || inc === undefined) {
        error = 'Error in amount';
        createLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData !== undefined) {
        error = 'Faction was found';
        createLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    createFaction(server, faction, {value, inc, date: Timestamp.fromDate(new Date())});
    await interaction.reply(`${faction} has been created`);
}

const command = new SlashCommandBuilder().setName('create').setDescription('Create Info');
generateInputs(command, inputs);

const create = {
    data: command,
    execute: runCreate
}

module.exports = create;
