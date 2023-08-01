const { SlashCommandBuilder } = require('discord.js');

const user = {
    data: new SlashCommandBuilder().setName('user').setDescription('Test Command'),
    execute: async (interaction) => await interaction.reply(interaction.user.username) 
}

module.exports = user;
