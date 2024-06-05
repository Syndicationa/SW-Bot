const { SlashCommandBuilder } = require('discord.js');
const { setDatabase } = require('../../functions/database');
const { collectIncome } = require('../../functions/income');

const sync = {
    data: new SlashCommandBuilder().setName('sync').setDescription('Test Command'),
    execute: async (interaction) => {
        const name = interaction.user.username;
        if (name !== "fer.0" && name !== "syndicationus") {
            await interaction.reply('Pong!')
            return;
        }
        await setDatabase();
        collectIncome();
        await interaction.reply("Success");
    }
}

module.exports = sync;
