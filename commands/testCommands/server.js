const { SlashCommandBuilder } = require('discord.js');

const server = {
    data: new SlashCommandBuilder().setName('server').setDescription('Test Command'),
    execute: async (interaction) => await interaction.reply(interaction.guild.name) 
}

module.exports = server;