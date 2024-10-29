const { SlashCommandBuilder } = require('discord.js');

const archiveChannel = async (interaction) => {
    const channel = interaction.channel;

    console.log(channel.name);

    await interaction.deferReply();

    const messages = await channel.messages.fetch({limit: 100});
    messages.reverse().map(message => {
        console.log(`Content: ${message.content} Time: ${message.createdAt}`);
    });

    await interaction.editReply("Thanks!");
}

const archive = {
    data: new SlashCommandBuilder().setName('archive').setDescription('Test Command'),
    execute: archiveChannel 
}

module.exports = archive;