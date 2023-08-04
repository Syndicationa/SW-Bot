const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "items", description: "Items to be bought", type: "String", required: true},
    {name: "amount", description: "Amount of funds(add a m, b, or t as multipliers)", type: "String", required: true},
]

const runBuy = async (interaction) => {
    const {faction, items, amount} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;
    
    const cost = handleCurrency(amount);
    if (isNaN(cost) || cost === undefined) {
        await interaction.reply('Error in amount');
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        await interaction.reply('Faction not found');
        return;
    }

    const newValue = factionData.value - cost;
    setFaction(server, faction, {value: newValue});
    await interaction.reply(`${faction} has bought ${items} for $${cost} and now has $${newValue}`);
}

const command = new SlashCommandBuilder().setName('buy').setDescription('Buy Items');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
