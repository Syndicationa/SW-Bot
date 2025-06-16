const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, convertToObject } = require('../../functions/currency');
const { getFaction, createFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { Timestamp } = require('firebase-admin/firestore');
const buildings = require('../../buildings');
const { PermissionsBitField } = require('discord.js');

const createLog = log('create');

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "treasury", description: "The amount of funds (m,b,t)", type: "String", required: false},
    {name: "role-name", description: "Name of the Role", type: "String", required: false},
    {name: "color", description: "Color of the faction role", type: "String", required: false},
    {name: "leader", description: "Leader", type: "User", required: false}
]

const createEmptyData = (resources) => resources.reduce((acc, v) => {return {...acc, [v]: 0}},{})

const createFactionRole = async (interaction, faction, roleName, color, leader) => {
    if (color === undefined) return "Not creating roles!";
    const userHasRoleCreation = interaction.memberPermissions.has(PermissionsBitField.Flags.ManageRoles)
    if (!userHasRoleCreation) return "Can't create a role";
    if (color.match(/#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]/g) === null) return "Invalid Color";

    let locationNumber = 90

    try {
        locationNumber = (await interaction.guild.roles.fetch('919674770717548584')).rawPosition - 1
    } catch(e) {
        return "Couldn't find the alliances role! AAAAAAAAAA!"
    }


    const name = roleName ?? faction;
    try {
        const role = interaction.guild.roles.create({
            name,
            color: color,
            position: locationNumber,
            mentionable: true,
            hoist: false,

        })

        if  (leader !== undefined) {
            const member = await interaction.guild.members.fetch(leader);
            const member2 = await member.roles.remove(['772642928077307915']);
            await member2.roles.add(['778339880467955772', role]);
        }
        return "Success, I hope!"
    } catch (e) {
        return `Error ${e}`
    }
}

const runCreate = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const treasury = arguments.treasury ?? "2560b 1460k CM 780k EL 1020k CS 40m Population 1k Influence";

    const roleState = await createFactionRole(interaction, faction, arguments["role-name"], arguments.color, arguments.leader)

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

    const genericMaps = settings.PlaceList.reduce((acc, v) => {return {...acc, [v]: {Hexes: 0, Buildings: [], Fleets: []}}},{});

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

    await interaction.reply(`${faction} has been created\n${roleState}`);
}

const command = new SlashCommandBuilder().setName('create').setDescription('Create Info');
generateInputs(command, inputs);

const create = {
    data: command,
    execute: runCreate
}

module.exports = create;
