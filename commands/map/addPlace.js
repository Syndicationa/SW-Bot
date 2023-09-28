const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency, splitCurrency } = require('../../functions/currency');
const { getFaction, createFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { Timestamp } = require('firebase-admin/firestore');

const addLog = log('add');

const inputs = [
    {name: "name", description: "Name of the Place", type: "String", required: true},
    {name: "resources", description: "The amount of resources per hex", type: "String", required: true},
    {name: "count", description: "Number of Hexagons", type: "Integer", required: false}
]

const createEmptyData = (resources) => resources.reduce((acc, v) => {return {...acc, [v]: 0}},{})

const runCreate = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {name, resources: resourceIncome, count} = arguments;

    let error = '';
    const server = interaction.guild.name;

    const settings = await getFaction(server, "Settings");
    
    const res = splitCurrency(resourceIncome);

    const NaNRes = res.some((value) => isNaN(value[0]));
    const isResValidType = res.every((value) => settings.Resources.indexOf(value[1]) >= 0)
    if (NaNRes || !isResValidType || res === undefined) {
        error = 'Error in amount';
        addLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const planetExists = settings.Places[name] !== undefined;
    if (planetExists) {
        error = 'Faction was found';
        addLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = createEmptyData(settings.Resources);
    const newResources = {};

    res.forEach(async (value) => {
        const resourceName = value[1]
        const amount = value[0];
        newResources[resourceName] = amount;
    })

    const place = {
        ResourceIncome: {...resources, ...newResources},
        Size: count,
        Claimed: 0
    };

    const newSettings = {
        Places: {
            ...settings.Places,
            [name]: place
        },
        PlaceList: [
            ...settings.PlaceList,
            name
        ]
    };

    setFaction(server, "Settings", newSettings);
    await interaction.reply(`${name} has been created`);
}

const command = new SlashCommandBuilder().setName('addplace').setDescription('Create Place');
generateInputs(command, inputs);

const create = {
    data: command,
    execute: runCreate
}

module.exports = create;
