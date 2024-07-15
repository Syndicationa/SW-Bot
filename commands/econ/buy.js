const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const buyLog = log('buy')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "items", description: "Items to be bought", type: "String", required: true},
    {name: "amount", 
        description: "Amount of funds(add a m, b, or t as multipliers). Use | + or ; to separate funds", 
        type: "String", required: true},
]

const runBuy = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, items, amount} = arguments;
    const server = interaction.guild.name;
    let error = "";

    if (interaction.user.username === "mwrazer") {
        await interaction.reply(
            `${faction} has not bought ${items}`
        );
        return;
    };

    const settings = await getFaction(server, "Settings");
    
    const costs = splitCurrency(amount);

    const NaNCosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNCosts || !isValidType || costs === undefined) {
        error = 'Error in amount';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;
    const newResources = {};

    costs.forEach(async (cost) => {
        const [amount, resourceName] = cost;
        const nVal = resources[resourceName] - amount;
        
        if (nVal < 0) {
            error = 'Not enough funds';
            buyLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newResources[resourceName] = nVal;
    })

    if (Object.keys(newResources).length !== Object.keys(costs).length) return;

    
    setFaction(server, faction, {Resources: {...resources, ...newResources}});
    await interaction.reply(
        `${faction} has bought ${items} for $${handleReturnMultiple(costs, settings.Resources)}`
    );
}

const command = new SlashCommandBuilder().setName('buy').setDescription('Buy Items');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
