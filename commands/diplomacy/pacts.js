const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const {getFaction,} = require("../../functions/database");
const { log } = require('../../functions/log');
const { objectMap, objectReduce } = require('../../functions/functions');
const { findPact } = require('../../functions/pactsandwar');

const listBLog = log('registerBuidling');

const IDToString = (IDList, data) => {
    const pacts = [...data.Pacts.Active, ...data.Pacts.Pending];
    return IDList.map(id => stringify(findPact(pacts, id)))
}

const stringify = pact => `${pact.Name}: ${pact.ID} Leader: ${pact.Leader} Members: ${pact.Participants.length} Requested: ${pact.Outgoing.length} Requesting: ${pact.Incoming.length}`
const block = array => array.length === 0 ? 'None':`\`\`\`${array.join('\n')}\`\`\``

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true}
]

const runListPacts = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const factionData = await getFaction(server, faction);
    const data = await getFaction(server, "data");
    
    if (factionData === undefined) {
        error = 'Faction not found';
        listBLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const pacts = IDToString(factionData.Pacts, data);
    const outgoing = IDToString(factionData.Outgoing.filter((request) => request.Type === "Pact").map(r => r.Data), data);
    const incoming = IDToString(factionData.Incoming.filter((request) => request.Type === "Pact").map(r => r.Data), data);

    await interaction.reply(
    `${faction}
    Active: ${block(pacts)}
    Outgoing Requests: ${block(outgoing)}
    Incoming Requests: ${block(incoming)}\n-# pacts`);
}

const command = new SlashCommandBuilder().setName('pacts').setDescription('List a faction\'s pacts');
generateInputs(command, inputs);

const listPacts = {
    data: command,
    execute: runListPacts
}

module.exports = listPacts;