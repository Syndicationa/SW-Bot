const { SlashCommandBuilder } = require('discord.js');
const { getFactionNames } = require('../../functions/database');
const { log } = require('../../functions/log');
const { generateInputs, retrieveInputs } = require('../../functions/createInputs');

const inputs = [
    {name: "type", description: `Quality of faction(eg. "hasDate")`, type: "String", required: false}
]

const command = new SlashCommandBuilder().setName('nations').setDescription('Get Nations');
generateInputs(command, inputs)

const nationLog = log('nations');

const factionQualities = quality => {
    switch (quality) {
        case "hasDate":
            return (_, d) => d.date !== undefined;
        case "noDate":
            return (_, d) => d.date === undefined;
        case "hasIncome":
            return (_, d) => d.inc !== undefined;
        case "noIncome":
            return (_, d) => d.inc ===   undefined;
        case undefined:
            return () => true;
        default:
            throw new Error();
    }
}

const runNations = async (interaction) => {
    const {type} = retrieveInputs(interaction.options, inputs);
    try {
        const f = factionQualities(type);
        const outputValue = getFactionNames(interaction.guild.name, f).join("\n");
        await interaction.reply(`${outputValue}`);
    } catch (e) {
        let err = "Invalid Quality"
        nationLog({arguments: {type}, error: err});
        await interaction.reply(`${err}`)
    }
};

const nations = {
    data: command,
    execute: runNations
}

module.exports = nations;
