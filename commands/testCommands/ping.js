const { SlashCommandBuilder } = require('discord.js');

const ping = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Test Command'),
    execute: async (interaction) => await interaction.reply('Pong!') 
}

module.exports = ping;
