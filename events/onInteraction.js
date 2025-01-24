const { Events, MessageFlags } = require('discord.js');

const lagMode = false;

const onInteraction = async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		if (lagMode) {
			await interaction.deferReply();
			interaction.reply = interaction.editReply;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
}

module.exports = {
	name: Events.InteractionCreate,
	execute: onInteraction
};
