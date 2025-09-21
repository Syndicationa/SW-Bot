// const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
// const {getFaction, setFaction} = require("../../functions/database");
// const { log } = require('../../functions/log');
// const { generateNextID } = require('../../functions/fleets');
// const { SlashCommandBuilder } = require('discord.js');

// const createFleetLog = log('create-fleet');

// const inputs = [
//     {name: "faction", description: "Faction", type: "String", required: true},
//     {name: "name", description: "Fleet Name", type: "String", required: true},
//     {name: "location", description: "Location", type: "String", required: true}
// ]

// const runCreateFleet = async (interaction) => {
//     const {faction, name, location} = retrieveInputs(interaction.options, inputs);
//     const server = interaction.guild.name;

//     const factionData = await getFaction(server, faction.toLowerCase());
//     if (factionData === undefined) {
//         createFleetLog({arguments: {faction}, error: 'Faction not found'})
//         await interaction.reply('Faction not found');
//         return;
//     }

//     //Check valid location here

//     const newID = generateNextID(factionData.Fleet);

//     const newFleets = [
//         ...factionData.Fleets,
//         {
//             ID: newID,
//             Vehicles: [],
//             State: {Action: "Defense", Location: location},
//             Value: {},
//             CSCost: 0
//         }
//     ]

//     setFaction(server, faction, {Fleets: newFleets});
//     await interaction.reply(`${faction} has formed the ${name} over ${location}`);
// }

// const command = new SlashCommandBuilder().setName('create-fleet').setDescription('Register a new fleet');
// generateInputs(command, inputs);

// const createFleet = {
//     data: command,
//     execute: runCreateFleet
// }

// module.exports = createFleet;