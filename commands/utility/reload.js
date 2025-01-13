const commandBuilder = require("../../functions/discord/commandBuilder");

const name = "reload";
const description = "Reloads a Command";

const inputs = [
    {name: "command", description: "Command Name", type: "String", required: true},
]

const command = {name, description, inputs};

const reloadCommand = async (interaction, inputs) => {
    const { command: commandName } = inputs;

    const name = interaction.user.username;
    if (name !== "fer.0" && name !== "syndicationus") {
        await interaction.reply('Pong!')
        return;
    }
    
    const command = interaction.client.commands.get(commandName.toLowerCase());

    if (!command) {
        return interaction.reply(`There is no command with name \`${commandName}\`!`);
    }

    delete require.cache[require.resolve(command.path)];

    try {
        const newCommand = require(command.path);
        newCommand.path = command.path;
        interaction.client.commands.set(newCommand.data.name, newCommand);
        await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
    } catch (error) {
        console.error(error);
        await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
    }
}

module.exports = commandBuilder(command, reloadCommand);