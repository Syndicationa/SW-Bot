const { SlashCommandBuilder } = require('discord.js');
const {prettyDate} = require('../../functions/dateWork');

const date = {
    data: new SlashCommandBuilder().setName('date').setDescription('Test Command'),
    execute: async (interaction) => await interaction.reply(prettyDate()) 
}

module.exports = date;
