const { SlashCommandBuilder } = require('discord.js');
const { getFactionNames, getFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { generateInputs, retrieveInputs } = require('../../functions/createInputs');

const inputs = [
    {name: "type", description: `Quality of faction(eg. "hasDate")`, type: "String", required: false}
]

const command = new SlashCommandBuilder().setName('treasury-list').setDescription('Get the list of treasuries');
generateInputs(command, inputs)

const factionlistLog = log('treasury-lists'); 

const factionQualities = quality => {
    switch (quality) {
        case "hasDate":
            return (_, d) => d.date !== undefined;
        case "noDate":
            return (_, d) => d.date === undefined;
        case "hasIncome":
            return (_, d) => d.inc !== undefined;
        case "noIncome":
            return (_, d) => d.inc === undefined;
        case undefined:
            return () => true;
        default:
            throw new Error();
    }
}


const runfactionlists = async (interaction) => {
    const {type} = retrieveInputs(interaction.options, inputs);
    try {
        const f = factionQualities(type);
        const names = getFactionNames('The Solar Wars', f);
        const outputs = await Promise.all(names.map(async name => {
            const faction = await getFaction("The Solar Wars", name);
            return {name, ...faction};
        }));
        outputs.sort((a, b) => b.Resources.ER - a.Resources.ER);
        const sortedMessages = outputs.map(faction => `${faction.name}: ${faction.Resources.ER}`);
        const outputValue = sortedMessages.join("\n");
        await interaction.reply(`${outputValue}`);
    } catch (e) {
        let err = "Invalid Quality"
        console.log(e);
        factionlistLog({arguments: {type}, error: err});
        await interaction.reply(`${err}`)
    }
};
const factionlists = {
    data: command,
    execute: runfactionlists
}

module.exports = factionlists;
