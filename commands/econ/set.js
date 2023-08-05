const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const setLog = log('set');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "information", description: "Data to be modified", type: "String", required: true},
    {name: "amount", description: "Amount of funds(add a m, b, or t as multipliers)", type: "String", required: true},
]

const runSet = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, information, amount} = arguments;

    let error = '';
    
    if (information !== "inc" && information !== "value") {
        error = `Remember that income is stored as "inc" and your treasury as "value", ${interaction.user.username}`;
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    const server = interaction.guild.name;
    
    const cost = handleCurrency(amount);
    if (isNaN(cost) || cost === undefined) {
        error = 'Error in amount';
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    setFaction(server, faction, {[information]: cost});
    await interaction.reply(`${faction} has edited ${information} and set it to ${cost}`);
}

const command = new SlashCommandBuilder().setName('set').setDescription('Set Info');
generateInputs(command, inputs);

const set = {
    data: command,
    execute: runSet
}

module.exports = set;
