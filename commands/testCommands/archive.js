const { SlashCommandBuilder } = require('discord.js');

const archiveChannel = async (interaction) => {
    const channel = interaction.channel;

    console.log(channel.name);

    await interaction.deferReply();

    const messages = await channel.messages.fetch();
    messages.reverse().map(message => {
        if (message.author.username !== "Syndicationus") {
            console.log(message.content)
            return;
        }
        console.log(JSON.stringify(message));
    });

    await interaction.editReply("Thanks!");
}

const archive = {
    data: new SlashCommandBuilder().setName('archive').setDescription('Test Command'),
    execute: archiveChannel 
}

module.exports = archive;