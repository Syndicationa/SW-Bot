const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const {getFaction,} = require("../../functions/database");
const { log } = require('../../functions/log');
const { handleReturnMultiple } = require('../../functions/currency');

const regBLog = log('registerBuidling');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
]

const runListConstructs = async (interaction) => {
    const {faction} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;

    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        regBLog({arguments: {faction}, error: 'Faction not found'})
        await interaction.reply('Faction not found');
        return;
    }
    
    const buildings = 
        factionData.Buildings.map(
            (build, i) => 
                `ID: ${i} ${build.name} @ ${handleReturnMultiple(build.cost, undefined, ", ")}`
        ).join("\n ");
    const vehicles = 
        factionData.Vehicles.map(
            (vehicle, i) => 
                `ID: ${i} ${vehicle.name} @ ${handleReturnMultiple(vehicle.cost, undefined, ", ")}`
        ).join("\n ");

    console.log(vehicles)

    await interaction.reply(
    `${faction} has \nBuildings: \`\`\` ${buildings}\`\`\` \nVehicles: \`\`\` ${vehicles}\`\`\``);
}

const command = new SlashCommandBuilder().setName('list').setDescription('List a faction\'s buildings and vehicles');
generateInputs(command, inputs);

const listConstructs = {
    data: command,
    execute: runListConstructs
}

module.exports = listConstructs;