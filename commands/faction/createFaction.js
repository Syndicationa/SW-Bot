const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency } = require('../../functions/currency');
const { getFaction, createFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { Timestamp } = require('firebase-admin/firestore');

const createLog = log('create');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "treasury", description: "The amount of funds (m,b,t)", type: "String", required: false},
    {name: "income", description: "The amount of weekly income", type: "String", required: false},
]

const createEmptyData = (resources) => resources.reduce((acc, v) => {return {...acc, [v]: 0}},{})

const runCreate = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const treasury = arguments.treasury ?? "50b";
    const income = arguments.income ?? "5b";

    let error = '';
    const server = interaction.guild.name;

    const settings = await getFaction(server, "Settings");
    
    const res = splitCurrency(treasury);
    const inc = splitCurrency(income);

    const NaNRes = res.some((value) => isNaN(value[0]));
    const NaNInc = inc.some((income) =>isNaN(income[0]))
    const isResValidType = res.every((value) => settings.Resources.indexOf(value[1]) >= 0)
    const isIncValidType = inc.every((income) => settings.Resources.indexOf(income[1]) >= 0)
    if (NaNRes || NaNInc || !isResValidType || !isIncValidType ||
            res === undefined || inc === undefined) {
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

    const resources = createEmptyData(settings.Resources);
    const newResources = {};

    const incomes = createEmptyData(settings.Resources);
    const newIncomes = {};

    settings.Resources.forEach(async (resourceName) => {
        const amount = (res.find(arr => arr[1] === resourceName) ?? [0])[0];
        const income = (inc.find(arr => arr[1] === resourceName) ?? [0])[0];

        newResources[resourceName] = amount;
        newIncomes[resourceName] = income;
    });

    const genericPlanet = {
        Hexes: 0,
        Buildings: [],
        Fleets: [],
    }
    const genericMaps = settings.PlaceList.reduce((acc, v) => {return {...acc, [v]: genericPlanet}},{});

    createFaction(server, faction, {
        Resources: {...resources, ...newResources}, 
        Income: {...incomes, ...newIncomes},
        Storage: incomes, 
        Maps: genericMaps,
        date: Timestamp.fromDate(new Date()),
        Vehicles: [],
        Buildings: [],
        Fleets: [],
        Missions: []
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
