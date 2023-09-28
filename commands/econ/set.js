const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const setLog = log('set');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "information", description: "Data to be modified [Income or Resources]", type: "String", required: true},
    {name: "amount", description: "Amount of funds(add a m, b, or t as multipliers)", type: "String", required: true},
]

const runSet = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, information, amount} = arguments;

    let error = '';
    
    if (information !== "Resources" && information !== "Income") {
        error = `Error in labeling", ${interaction.user.username}`;
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    const server = interaction.guild.name;
    
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
        setLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const value = factionData[information];
    const newValue = {};

    costs.forEach(async (cost) => {
        const resourceName = cost[1]
        const amount = cost[0]
        const nVal = amount;
        
        if (nVal < 0) {
            error = 'Not enough funds';
            setLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newValue[resourceName] = nVal;
    })

    setFaction(server, faction, {[information]: {...value, ...newValue}});
    await interaction.reply(`${faction} has edited ${information} and set it to ${handleReturnMultiple(costs)}`);
}

const command = new SlashCommandBuilder().setName('set').setDescription('Set Info');
generateInputs(command, inputs);

const set = {
    data: command,
    execute: runSet
}

module.exports = set;
