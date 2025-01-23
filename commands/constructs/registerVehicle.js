// const { SlashCommandBuilder } = require('discord.js');
// const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
// const { Timestamp } = require('firebase-admin/firestore');
// const {getFaction, setFaction} = require("../../functions/database");
// const { log } = require('../../functions/log');
// const { splitCurrency } = require('../../functions/currency');
// const { generateNextID } = require('../../functions/fleets');

// const regVLog = log('registerVehicle');

// const inputs = [
//     {name: "faction", description: "Faction", type: "String", required: true},
//     {name: "name", description: "Vehicle Name", type: "String", required: true},
//     {name: "cost", description: "Link to the rating message", type: "String", required: true},
//     {name: "domain", description: "Domain of the Vehicle", type: "String", required: true, 
//         choices: [
//             {name: "Space", value: "Space"},
//             {name: "Air", value: "Air"},
//             {name: "Sea", value: "Sea"},
//             {name: "Land", value: "Land"},
            
//             {name: "Space|Air", value: "Space|Air"},
//             {name: "Space|Sea", value: "Space|Sea"},
//             {name: "Space|Land", value: "Space|Land"},
//             {name: "Air|Sea", value: "Air|Sea"},
//             {name: "Air|Land", value: "Air|Land"},

//             {name: "Sea|Land", value: "Sea|Land"},

//             {name: "Air|Sea|Land", value: "Air|Sea|Land"},
//             {name: "Space|Sea|Land", value: "Space|Sea|Land"},
//             {name: "Space|Air|Land", value: "Space|Air|Land"},
//             {name: "Space|Air|Sea", value: "Space|Air|Sea"},

//             {name: "Space|Air|Sea|Land", value: "Space|Air|Sea|Land"},
//         ]},
//     {name: "count", description: "Starting Count", type: "Integer", required: false, default: 0},
//     {name: "year", description: "Date of creation", type: "Integer", required: false},
//     {name: "month", description: "Date of creation", type: "Integer", required: false},
//     {name: "day", description: "Date of creation", type: "Integer", required: false},
// ]

// const runRegisterVehicle = async (interaction) => {
//     const {faction, name, cost, year, month, day, count} = retrieveInputs(interaction.options, inputs);
//     const server = interaction.guild.name;

//     const [guildID, channelID, messageID] = cost.match(/\d+/g)
//     const channel = await interaction.guild.channels.fetch(channelID);
//     const message = await channel.messages.fetch(messageID);

//     console.log(message);
//     // console.log(message.interactionMetadata);

//     // const settings = await getFaction(server, "settings");
//     // const factionData = await getFaction(server, faction.toLowerCase());
//     // if (factionData === undefined) {
//     //     regVLog({arguments: {faction}, error: 'Faction not found'})
//     //     await interaction.reply('Faction not found');
//     //     return;
//     // }
    
//     // const lastDate = Date.UTC(year, month - 1, day);
//     // const newDate = new Date(lastDate);
//     // const newTimestamp = Timestamp.fromDate(newDate);

//     // const costs = splitCurrency(cost);
//     // const NaNCosts = costs.some((cost) => isNaN(cost[0]));
//     // const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
//     // if (NaNCosts || !isValidType || costs === undefined) {
//     //     error = 'Error in amount';
//     //     regVLog({arguments, error});
//     //     await interaction.reply(error);
//     //     return;
//     // }

//     // const calcCosts = {};

//     // costs.forEach(async (cost) => {
//     //     const resourceName = cost[1]
//     //     const amount = cost[0]
//     //     const nVal = amount;
        
//     //     if (nVal < 0) {
//     //         error = 'Not enough funds';
//     //         regVLog({arguments, error});
//     //         await interaction.reply(error);
//     //         return;
//     //     }

//     //     calcCosts[resourceName] = nVal;
//     // })

//     // const newID = generateNextID(factionData.Vehicles);

//     // const newVehicles = [
//     //     ...factionData.Vehicles,
//     //     {date: newTimestamp, name, cost: calcCosts, count: count, ID: newID}
//     // ]  

//     // setFaction(server, faction, {Vehicles: newVehicles});
//     await interaction.reply(`${faction} has added the ${name} to its arsenal`);
// }

// const command = new SlashCommandBuilder().setName('register-vehicle').setDescription('Register a new vehicle');
// generateInputs(command, inputs);

// const setdate = {
//     data: command,
//     execute: runRegisterVehicle
// }

// module.exports = setdate;