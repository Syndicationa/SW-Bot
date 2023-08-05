const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency } = require('../../functions/currency');
const { db } = require('../../firebase');
const { log } = require('../../functions/log');

const transferLog = log('transfer');

const inputs = [
    {name: "source", description: "Source of the money", type: "String", required: true},
    {name: "destination", description: "Destination of the money", type: "String", required: true},
    {name: "amount", description: "Amount of funds(add a m, b, or t as multipliers)", type: "String", required: true},
]

const getFactions = async (server) => {
    const factions = await db.collection(server).get();
    return factions;
}

const setFaction = (server, faction, newData) => 
    db.collection(server).doc(faction.toLowerCase()).update(newData);

const runTransfer = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {source: s, destination: d, amount} = arguments;
    const source = s.toLowerCase();
    const destination = d.toLowerCase();

    let error = '';

    const server = interaction.guild.name;

    const transferAmount = handleCurrency(amount);
    if (isNaN(transferAmount) || transferAmount === undefined) {
        error = 'Error in amount';
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factions = await getFactions(server);
    if (factions.empty) {
        error = 'Not in supported server';
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    let sourceDocument;
    let targetDocument;

    factions.forEach((doc) => {
        if (doc.id === source) sourceDocument = doc.data();
        if (doc.id === destination) targetDocument = doc.data();
    });
    if (sourceDocument === undefined || targetDocument === undefined) {
        error = 'Faction not found';
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const sourceValue = sourceDocument.value;
    const targetValue = targetDocument.value;

    const newSourceValue = sourceValue - transferAmount;
    const newTargetValue = targetValue + transferAmount;
    setFaction(server, source, {value: newSourceValue});
    setFaction(server, destination, {value: newTargetValue})
    await interaction.reply(`${s} has sent $${transferAmount} to ${d}`);
}

const command = new SlashCommandBuilder().setName('transfer').setDescription('Transfer Money');
generateInputs(command, inputs);

const transfer = {
    data: command,
    execute: runTransfer
}

module.exports = transfer;
