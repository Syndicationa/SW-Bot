const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { getFaction, deleteFaction, createFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const deleteLog = log('delete');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
]

const runDelete = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;

    let error = '';
    const server = interaction.guild.name;

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        deleteLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    deleteFaction(server, faction);
    await interaction.reply(`${faction} has been deleted`);
}

const command = new SlashCommandBuilder().setName('delete').setDescription('Delete Faction');
generateInputs(command, inputs);

const del = {
    data: command,
    execute: runDelete
}

module.exports = del;
