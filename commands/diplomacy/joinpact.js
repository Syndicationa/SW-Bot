const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { addResources } = require('../../functions/resourceMath');
const { calculateIncome } = require('../../functions/incomeMath');
const { generateNextPactID, makePact, findPact, joinAPact, calculateCost } = require('../../functions/pactsandwar');

const joinPactLog = log('joinpact')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "id", description: "ID of pact", type: "Number", required: true},
]

const runJoinPact = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, id: ID} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const data = await getFaction(server, "Data");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        joinPactLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const pactList = [...data.Pacts.Active, ...data.Pacts.Pending];

    const Pending = data.Pacts.Pending.filter(pact => pact.ID !== ID);
    const Active = data.Pacts.Active.filter(pact => pact.ID !== ID);

    const pact = findPact(pactList, ID);

    if (pact === undefined) {
        error = 'Pact not found';
        joinPactLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    if (pact.Participants.some(member => member === faction.toLowerCase())) {
        error = `${faction} already member of pact`;
        joinPactLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const [success, newPact] = joinAPact(pact, faction);
    
    const factions = await Promise.all([...newPact.Participants.map(async (name) => {
        const factionData = await getFaction(server,name);
        return [name, factionData]
    }), [faction, factionData]]);

    const newFactions = calculateCost(factions, [...Active], newPact);

    console.log(Array.isArray(newFactions));
    
    if (typeof newFactions === 'string') {
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
            `${faction} cannot join ${pact.Name}, due to ${newFactions}'s Influence`)]});
        return;
    }

    if (success) {
        newFactions.forEach(([name, faction]) => {
            setFaction(server, name, faction);
        });
        
        if (pact.Participants.length === 1) {
            const name = pact.Participants[0];
            const founder = await getFaction(server, name);
            

            if (founder === undefined) {
                error = 'Pact Founder not found';
                joinPactLog({arguments, error});
                await interaction.reply(error);
                return;
            }
            setFaction(server, name, 
                {Pacts: [...founder.Pacts, ID], 
                    Outgoing: founder.Outgoing.filter(request => request.Type !== "Pact" || request.Data !== ID)})
        }
                
        setFaction(server, faction, {
            Pacts: [...factionData.Pacts, newPact.ID], 
            Incoming: factionData.Incoming.filter(request => request.Data !== ID)});

        setFaction(server, "data", {Pacts: {Pending, Active: [...Active, newPact]}});
        
                const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
            `${faction} has joined ${newPact.Name}`
        );
        await interaction.reply({ embeds: [ embed ]});
    } else {
        if (pact.Participants.length >= 2)
            setFaction(server, "data", {Pacts: {Pending, Active: [...Active, newPact]}});
        else
            setFaction(server, "data", {Pacts: {Pending: [...Pending, newPact], Active}});
        setFaction(server, faction, {Outgoing: [...factionData.Outgoing, {Type: 'Pact', Data: newPact.ID}]});
    
        const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
            `${faction} has requested to join ${newPact.Name}`
        );
        await interaction.reply({ embeds: [ embed ]});
    }
}

const command = new SlashCommandBuilder().setName('join-pact').setDescription('Join a Pact or Request to join a pact');
generateInputs(command, inputs);

const joinpact = {
    data: command,
    execute: runJoinPact
}

module.exports = joinpact;