const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency, handleReturn } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const buyLog = log('buy')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "items", description: "Items to be bought", type: "String", required: true},
    {name: "amount", description: "Amount of funds(add a m, b, or t as multipliers)", type: "String", required: true},
]

const runBuy = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, items, amount} = arguments;
    const server = interaction.guild.name;
    let error = "";
    
    const cost = handleCurrency(amount);
    if (isNaN(cost) || cost === undefined) {
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

    const newValue = factionData.value - cost;

    if (newValue < 0) {
        error = 'Not enough funds';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    setFaction(server, faction, {value: newValue});
    await interaction.reply(`${faction} has bought ${items} for $${handleReturn(cost)} and now has $${handleReturn(newValue)}`);
}

const command = new SlashCommandBuilder().setName('buy').setDescription('Buy Items');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
