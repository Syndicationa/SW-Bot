const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { addResources, calculateIncome } = require('../../functions/resourceMath');
const { generateNextPactID, makePact, findPact, joinAPact, addMemberToPact, calculateCost } = require('../../functions/pactsandwar');

const addMemberLog = log('addmember')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "id", description: "ID of pact", type: "Number", required: true},
    {name: "add", description: "Do you want to add them", type: "Boolean", required: false, default: true}
]

const runAddMember = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, id: ID, add} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const data = await getFaction(server, "Data");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        addMemberLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const pactList = [...data.Pacts.Active, ...data.Pacts.Pending];

    const Pending = data.Pacts.Pending.filter(pact => pact.ID !== ID);
    const Active = data.Pacts.Active.filter(pact => pact.ID !== ID);

    const pact = findPact(pactList, ID);

    if (pact === undefined) {
        error = 'Pact not found';
        addMemberLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const [success, newPact] = addMemberToPact(pact, faction);

    let embed = ""
    if (!add) {
        const newPact = {
            ...pact,
            Incoming: pact.Incoming.filter(name => name !== faction)
        }
        if (pact.Participants.length >= 2)
            setFaction(server, "data", {Pacts: {Pending, Active: [...Active, newPact]}});
        else
            setFaction(server, "data", {Pacts: {Pending: [...Pending, newPact], Active}});

        embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
            `${faction} cannot join ${newPact.Name}`
        );
    } else if (success) {
        embed = await addingMember(server, faction, factionData, newPact, Active);
    } else {
        embed = newRequest(server, faction, factionData, newPact);
    }
    await interaction.reply({ embeds: [ embed ]});
}

const newRequest = (server, faction, factionData, pact) => {
    if (pact.Participants.length >= 2)
        setFaction(server, "data", {Pacts: {Pending, Active: [...Active, pact]}});
    else
        setFaction(server, "data", {Pacts: {Pending: [...Pending, pact], Active}});
    setFaction(server, faction, {Incoming: [...factionData.Incoming, {Type: 'Pact', Data: pact.ID}]});

    return new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${faction} has been requested to join ${pact.Name}`
    );
}

const addingMember = async (server, faction, factionData, pact, activePacts) => {
    const factions = [...pact.Participants((name) => {
        const factionData = getFaction(name);
        return [name, factionData]
    }), [faction, factionData]];

    const newFactions = calculateCost(factions, [...activePacts, pact]);

    if (typeof newFactions === 'string') return new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${faction} cannot join ${pact.Name}, due to ${newFactions}'s Influence`
    );

    setFaction(server, faction, {
        Pacts: [...factionData.Pacts, pact.ID], 
        Outgoing: factionData.Outgoing.filter(request => request.Data !== ID) });
    setFaction(server, "data", {Pacts: {Pending, Active: [...Active, pact]}});

    newFactions.forEach(([name, faction]) => {
        setFaction(server, name, faction);
    });

    if (pact.Participants.length === 1) {
        const name = pact.Participants[0];

        const founder = await getFaction(server, name);
        if (founder === undefined) {
            error = 'Pact Founder not found';
            addMemberLog({arguments, error});
            await interaction.reply(error);
            return;
        }
        setFaction(server, name, 
            {Pacts: [...founder.Pacts, ID], Outgoing: founder.Outgoing.filter(request => request.Data !== ID)})
    } //Makes pact active for leader
    
    return new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${faction} has joined ${pact.Name}`
    );
}

const command = new SlashCommandBuilder().setName('add-member').setDescription('Add a member to the pact');
generateInputs(command, inputs);

const addMember = {
    data: command,
    execute: runAddMember
}

module.exports = addMember;