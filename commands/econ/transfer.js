const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency } = require('../../functions/currency');
const { db } = require('../../firebase');
const { log } = require('../../functions/log');
const { setFaction, getFaction } = require('../../functions/database');

const transferLog = log('transfer');

const inputs = [
    {name: "source", description: "Source of the money", type: "String", required: true},
    {name: "destination", description: "Destination of the money", type: "String", required: true},
    {name: "amount", description: "Amount of funds(add a m, b, or t as multipliers)", type: "String", required: true},
]

const runTransfer = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {source, destination, amount} = arguments;

    let error = '';

    const server = interaction.guild.name;

    const transferAmount = handleCurrency(amount);
    if (isNaN(transferAmount) || transferAmount === undefined) {
        error = 'Error in amount';
        transferLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    let sourceDocument = getFaction(server, source);
    let targetDocument = getFaction(server, destination);

    if (sourceDocument === undefined || targetDocument === undefined) {
        error = 'Faction not found';
        transferLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const sourceValue = sourceDocument.value;
    const targetValue = targetDocument.value;

    const newSourceValue = sourceValue - transferAmount;
    const newTargetValue = targetValue + transferAmount;
    setFaction(server, source, {value: newSourceValue});
    setFaction(server, destination, {value: newTargetValue})
    await interaction.reply(`${source} has sent $${transferAmount} to ${destination}`);
}

const command = new SlashCommandBuilder().setName('transfer').setDescription('Transfer Money');
generateInputs(command, inputs);

const transfer = {
    data: command,
    execute: runTransfer
}

module.exports = transfer;
