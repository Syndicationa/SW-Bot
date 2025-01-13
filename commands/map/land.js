const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const {getFaction,} = require("../../functions/database");
const { log } = require('../../functions/log');
const { handleReturn } = require('../../functions/currency');

const listLLog = log('land');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
]

const runListConstructs = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const factionData = await getFaction(server, faction);
    const maps = factionData?.Maps;
    if (factionData === undefined) {
        error = 'Faction not found';
        listLLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (maps === undefined) {
        error = 'Location not found';
        listLLog({arguments, error});
        await interaction.reply(error);
    }
    
    const locations = Object.keys(maps).filter(name => maps[name].Hexes > 0);
    const [longestName, longestNumber, total] = locations.reduce(([lname, lnum, a], name) => {
        return [Math.max(lname, name.length), Math.max(lnum, maps[name].Hexes.toString().length), a + maps[name].Hexes]
    }, [0,0,0]);

    const string = locations.map((name) => {
        return name.padEnd(longestName + 1) + maps[name].Hexes.toString().padStart(longestNumber);
    }).join("\n");

    await interaction.reply(
    `${faction} has land: \`\`\`${string}\`\`\` making ${total} hexagons`);
}

const command = new SlashCommandBuilder().setName('land').setDescription('List a faction\'s land');
generateInputs(command, inputs);

const listConstructs = {
    data: command,
    execute: runListConstructs
}

module.exports = listConstructs;