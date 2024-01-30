const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { db } = require('../../firebase');
const { getFaction } = require('../../functions/database');
const { handleReturnMultiple } = require('../../functions/currency');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
]

const command = new SlashCommandBuilder().setName('treasury').setDescription('Get Treasury');
generateInputs(command, inputs);

const getF = async (server, faction) => {
    const output = await getFaction(server, faction)
    const order = await getFaction(server, "Settings");
    if (faction === "Laro's will to live" || faction.toLowerCase() === "syn") return `does exist`
    return output ? `${handleReturnMultiple(output.Resources, order.Resources)}`:`doesn't exist`
}

const treasury = {
    data: command,
    execute: async (interaction) => {
        let message = "";
        const {faction} = retrieveInputs(interaction.options, inputs);
        const outputValue = await getF(interaction.guild.name, faction);
		const embed = new EmbedBuilder().setTitle(`${faction}'s treasury`).setColor(0x0099FF).setDescription(`${outputValue}`);
		await interaction.reply({ embeds: [ embed ] });
    }
}

module.exports = treasury;
