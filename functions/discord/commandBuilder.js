const { SlashCommandBuilder } = require('discord.js');
const { generateInputs, retrieveInputs } = require('./optionHandler');

const executor = (func, inputs) => {
    return (interaction) => 
        func(interaction, retrieveInputs(interaction.options, inputs));
}

const makeCommand = (commandInfo, func) => {
    const {
        name,
        description = "",
        inputs = []
    } = commandInfo;

    if (typeof name !== "string" && name.length > 1) {
        throw "Name must be a non-empty string";
    }

    const command = new SlashCommandBuilder();
    command.setName(name);
    command.setDescription(description);
    generateInputs(command, inputs);

    return {
        data: command,
        execute: executor(func, inputs)
    }
};

module.exports = makeCommand;