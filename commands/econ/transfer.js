const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
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

    const settings = await getFaction(server, "Settings");
    
    const costs = splitCurrency(amount);

    const NaNCosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNCosts || !isValidType || costs === undefined) {
        error = 'Error in amount';
        transferLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    let sourceDocument = await getFaction(server, source);
    let targetDocument = await getFaction(server, destination);

    if (sourceDocument === targetDocument) {
        error = 'You may not send money to yourself';
        transferLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    if (sourceDocument === undefined || targetDocument === undefined) {
        error = 'Faction not found';
        transferLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const sourceResources = sourceDocument.Resources;
    const targetResources = targetDocument.Resources;

    let newSourceRes = {};
    let newTargetRes = {};
    
    costs.forEach(async (cost) => {
        const resourceName = cost[1]
        const amount = cost[0]
        const nSVal = sourceResources[resourceName] - amount;
        const nTVal = targetResources[resourceName] + amount;
        
        if (nSVal < 0) {
            error = 'Not enough funds';
            transferLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newSourceRes[resourceName] = nSVal;
        newTargetRes[resourceName] = nTVal;
    })
    setFaction(server, source, {Resources: {...sourceResources, ...newSourceRes}});
    setFaction(server, destination, {Resources: {...targetResources, ...newTargetRes}})
    await interaction.reply(`${source} has sent to ${destination}: ${handleReturnMultiple(costs)}`);
}

const command = new SlashCommandBuilder().setName('transfer').setDescription('Transfer Money');
generateInputs(command, inputs);

const transfer = {
    data: command,
    execute: runTransfer
}

module.exports = transfer;
