const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { getFaction, deleteFaction, createFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const renameLog = log('rename');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "new", description: "New name for Faction", type: "String", required: true},
]

const runRename = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, new: newFaction} = arguments;

    let error = '';
    const server = interaction.guild.name;

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        renameLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    deleteFaction(server, faction);
    createFaction(server, newFaction, factionData);
    await interaction.reply(`${faction} has been renamed to ${newFaction}`);
}

const command = new SlashCommandBuilder().setName('rename').setDescription('Rename Faction');
generateInputs(command, inputs);

const rename = {
    data: command,
    execute: runRename
}

module.exports = rename;
