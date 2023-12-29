const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const refundLog = log('refund')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "items", description: "Items to be bought", type: "String", required: true},
    {name: "amount", description: "Amount of funds(add a m, b, or t as multipliers)", type: "String", required: true},
]

const runRefund = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    if (interaction.user.username === "mwrazer") return;
    const {faction, items, amount} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");
    
    const costs = splitCurrency(amount);

    const NaNCosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNCosts || !isValidType || costs === undefined) {
        error = 'Error in amount';
        refundLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        refundLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;
    const newResources = {};

    costs.forEach(async (cost) => {
        const resourceName = cost[1]
        const amount = cost[0]
        const nVal = resources[resourceName] + amount;
        
        if (nVal < 0) {
            error = 'Not enough funds';
            refundLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newResources[resourceName] = nVal;
    })

    setFaction(server, faction, {Resources: {...resources, ...newResources}});
    await interaction.reply(
        `${faction} has refunded ${items} for $${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('refund').setDescription('Refund Items');
generateInputs(command, inputs);

const refund = {
    data: command,
    execute: runRefund
}

module.exports = refund;
