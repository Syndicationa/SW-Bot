const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { getFaction, deletePlace } = require('../../functions/database');
const { log } = require('../../functions/log');

const deleteLog = log('delete');

const inputs = [
    {name: "place", description: "Name of the Place", type: "String", required: true},
]

const runDelete = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {place} = arguments;

    let error = '';
    const server = interaction.guild.name;

    const settings = await getFaction(server, "Settings");

    const factionData = settings.Places[place];
    if (factionData === undefined) {
        error = 'Faction not found';
        deleteLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    deletePlace(server, place);
    await interaction.reply(`${place} has been deleted`);
}

const command = new SlashCommandBuilder().setName('deleteplace').setDescription('Delete Place');
generateInputs(command, inputs);
