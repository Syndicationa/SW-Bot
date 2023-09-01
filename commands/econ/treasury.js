const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { db } = require('../../firebase');
const { getFaction } = require('../../functions/database');
const { handleReturn } = require('../../functions/currency');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
]

const command = new SlashCommandBuilder().setName('treasury').setDescription('Get Treasury');
generateInputs(command, inputs);

const getF = async (server, faction) => {
    const output = await getFaction(server, faction)
    if (faction === "Laro's will to live" || faction.toLowerCase() === "syn") return `does exist`
    return output ? `has $${handleReturn(output.value)}`:`doesn't exist`
}

const treasury = {
    data: command,
    execute: async (interaction) => {
        let message = "";
        if (interaction.user.username === "mwrazer") {
            message = "I see you Razer"
        }
        const {faction} = retrieveInputs(interaction.options, inputs);
        const outputValue = await getF(interaction.guild.name, faction);
        await interaction.reply(`${message}\n${faction} ${outputValue}`);
    }
}

module.exports = treasury;
