const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { addResources } = require('../../functions/resourceMath');
const { calculateIncome } = require('../../functions/incomeMath');
const { generateNextPactID, makePact, findPact, joinAPact, addMemberToPact, removeFromPact } = require('../../functions/pactsandwar');

const removeMemberLog = log('removemember')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "id", description: "ID of pact", type: "Number", required: true},
]

const runRemoveMember = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, id: ID} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const data = await getFaction(server, "Data");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        removeMemberLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const pactList = [...data.Pacts.Active, ...data.Pacts.Pending];

    const Pending = data.Pacts.Pending.filter(pact => pact.ID !== ID);
    const Active = data.Pacts.Active.filter(pact => pact.ID !== ID);

    const pact = findPact(pactList, ID);

    if (pact === undefined) {
        error = 'Pact not found';
        removeMemberLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    if (pact.Participants.some(name => name === faction)) {
        error = 'Faction in pact';
        removeMemberLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newPact = removeFromPact(pact, faction);

    if (newPact.Participants.length !== pact.Participants.length || newPact.Incoming.length !== newPact.Incoming.length) {
        const newFactionData = {
            ...factionData,
            Pacts:  factionData.Pacts.filter(pact => pact !== ID), 
            Outgoing: factionData.Outgoing.filter(request => request.Data !== ID),
        };

        const factions = [...pact.Participants((name) => {
            const factionData = getFaction(name);
            return [name, factionData]
        }), [faction, newFactionData]];
    
        const newFactions = calculateCost(factions, [...activePacts, pact]);
    
        if (typeof newFactions === 'string') return new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
            `${faction} cannot leave ${pact.Name}, due to ${newFactions}'s Influence`
        );
    
        newFactions.forEach(([name, faction]) => {
            setFaction(server, name, faction);
        });
    } else 
        setFaction(server, faction, {Incoming: factionData.Incoming.filter(request => request.Data !== ID)});

    if (newPact.Participants.length <= 1 && newPact.Incoming.length === 0 && newPact.Outgoing.length === 0) {
        const name = pact.Participants[0] ?? "None";

        setFaction(server, "data", {Pacts: {Pending, Active}})

        removeFounder(name, newPact, ID);
    } else if (pact.Participants.length >= 2)
        setFaction(server, "data", {Pacts: {Pending, Active: [...Active, newPact]}});
    else
        setFaction(server, "data", {Pacts: {Pending: [...Pending, newPact], Active}});

    const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${faction} leaves ${newPact.Name}`
    );
    await interaction.reply({ embeds: [ embed ]});
}

const removeFounder = async (name, pact, ID) => {
    if (name === "None") return;
    const founder = await getFaction(server, name);
    if (founder === undefined) {
        error = 'Pact founder not found';
        removeMemberLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newUsages = addResources(founder.Usages, {Influence: -pact.Cost.join});

    setFaction(server, name, {
        Pacts:  founder.Pacts.filter(pact => pact !== ID), 
        Incoming: founder.Incoming.filter(request => request.Data !== ID),
        Outgoing: founder.Outgoing.filter(request => request.Data !== ID),
        Usages: newUsages
    });
}

const command = new SlashCommandBuilder().setName('remove-member').setDescription('Remove a member from the pact');
generateInputs(command, inputs);

const removeMember = {
    data: command,
    execute: runRemoveMember
}

module.exports = removeMember;