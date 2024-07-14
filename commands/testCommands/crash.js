const { SlashCommandBuilder } = require('discord.js');

const crash = {
    data: new SlashCommandBuilder().setName('crash').setDescription('Test Command'),
    execute: async (interaction) => {
        console.log(interaction.user);
        const name = interaction.user.username;
        if (name !== "fer.0" && name !== "syndicationus") {
            await interaction.reply('Pong!')
            return;
        }
        await interaction.reply("");
    }
}

module.exports = crash;
