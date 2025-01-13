const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { addResources } = require('../../functions/resourceMath');
const { calculateIncome } = require('../../functions/incomeMath');
const { generateNextPactID, makePact } = require('../../functions/pactsandwar');

const createpactLog = log('createpact')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "targets", description: "Specify other nations", type: "String", required: true},
    {name: "type", description: "Type of treaty", type: "String", required: true,
        choices: [{name: "MDP", value: "MDP"}, {name: "NAP", value: "NAP"}]},
    {name: "name", description: "Name of Treaty", type: "String", required: false},
]

const runCreatePact = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, targets, type, name} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const data = await getFaction(server, "Data");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        createpactLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const targetsData = 
        (await Promise.all(
            targets
                .split(" ")
                .map(async name => [name, await getFaction(server, name)])
        )).filter(([_, datum]) => datum !== undefined)

    if (targetsData.length === 0) {
        error = 'Targets not found';
        createpactLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    
    const joinCosts  = {MDP: 50, NAP: 20}
    const joinCost = joinCosts[type];
       
    const pactList = [...data.Pacts.Active, ...data.Pacts.Pending];
    const nextID = generateNextPactID(pactList);
    const pact = makePact(
        nextID, type, 
        [faction.toLowerCase(), ...targetsData.map(([name]) => name.toLowerCase())],
    {join: joinCost}, name)

    setFaction(server, faction, {Outgoing: [...factionData.Outgoing, {Type: `Pact`, Data: pact.ID}]});

    setFaction(server, "data", {Pacts: {...data.Pacts, Pending: [...data.Pacts.Pending, pact]}});
    
    targetsData.forEach(async ([name, data]) => {
        setFaction(server, name, {Incoming: [...data.Incoming, {Type: 'Pact', Data: pact.ID}]})
    })
    const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${faction} has sent requests to join ${pact.Name}`
    );
    await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('create-pact').setDescription('Create a Pact');
generateInputs(command, inputs);

const createpact = {
    data: command,
    execute: runCreatePact
}

module.exports = createpact;