const { SlashCommandBuilder } = require('discord.js');
const { getFactionNames, getFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { generateInputs, retrieveInputs } = require('../../functions/createInputs');
const { objectReduce } = require('../../functions/functions');

const inputs = [
    {name: "type", description: `Quality of faction(eg. "hasDate")`, type: "String", required: false}
]

const command = new SlashCommandBuilder().setName('nations').setDescription('Get Nations');
generateInputs(command, inputs)

const nationLog = log('nations');

const count = (factionData) => objectReduce(factionData.Maps, (acc, map) => acc + map.Hexes, 0);

const getHexCounts = (name, factionData) => {
    return `${name}: ${count(factionData)}`;
}

const factionQualities = quality => {
    console.log(quality);
    switch (quality) {
        case "hasDate":
            return (_, d) => d.date !== undefined;
        case "noDate":
            return (_, d) => d.date === undefined;
        case "hasIncome":
            return (_, d) => d.inc !== undefined;
        case "noIncome":
            return (_, d) => d.inc === undefined;
        case "hasLand":
            return (n, d) => n !== "settings" && count(d) > 0;
        case "noER":
            return (_, d) => d.Resources.ER === 0
        case undefined:
            return () => true;
        default:
            throw new Error();
    }
}

const runNations = async (interaction) => {
    const {type} = retrieveInputs(interaction.options, inputs);
    try {
        const server = interaction.guild.name;
        const f = factionQualities(type);
        const outputValue = getFactionNames(server, f, getHexCounts);
        await interaction.reply(`${outputValue.join("\n") || "No nation meet criteria"}`);
    } catch (e) {
        let err = "Invalid Quality"
        console.log(e);
        nationLog({arguments: {type}, error: err});
        await interaction.reply(`${err}`)
    }
};

const nations = {
    data: command,
    execute: runNations
}

module.exports = nations;
