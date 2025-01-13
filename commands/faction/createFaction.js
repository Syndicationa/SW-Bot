const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, convertToObject } = require('../../functions/currency');
const { getFaction, createFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { Timestamp } = require('firebase-admin/firestore');
const buildings = require('../../buildings');

const createLog = log('create');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "treasury", description: "The amount of funds (m,b,t)", type: "String", required: false},
]

const createEmptyData = (resources) => resources.reduce((acc, v) => {return {...acc, [v]: 0}},{})

const runCreate = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const treasury = arguments.treasury ?? "2560b 1460k CM 780k EL 1020k CS 40m Population";

    let error = '';
    const server = interaction.guild.name;

    const settings = await getFaction(server, "Settings");
    
    const res = splitCurrency(treasury);

    const NaNRes = res.some((value) => isNaN(value[0]));
    const isResValidType = res.every((value) => settings.Resources.indexOf(value[1]) >= 0)
    if (NaNRes || !isResValidType || res === undefined) {
        error = 'Error in amount';
        createLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData !== undefined) {
        error = 'Faction was found';
        createLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = convertToObject(settings.Resources, res);

    const genericPlanet = {
        Hexes: 0,
        Buildings: [],
        Fleets: [],
    }
    const genericMaps = settings.PlaceList.reduce((acc, v) => {return {...acc, [v]: genericPlanet}},{});

    createFaction(server, faction, {
        Resources: resources,
        Capacities: createEmptyData(settings.Capacities),
        Usages: createEmptyData(settings.Capacities),
        Storage: createEmptyData(settings.Storage),
        Buildings: buildings,
        Maps: genericMaps,

        Wars: [],
        Trades: [],
        Missions: [],
        Outgoing: [],
        Vehicles: [],
        Fleets: [],
        Incoming: [],
        Pacts: [],
    });
    await interaction.reply(`${faction} has been created`);
}

const command = new SlashCommandBuilder().setName('create').setDescription('Create Info');
generateInputs(command, inputs);

const create = {
    data: command,
    execute: runCreate
}

module.exports = create;
