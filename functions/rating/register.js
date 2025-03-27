const { Timestamp } = require('firebase-admin/firestore');
const {getFaction, setFaction} = require("../../functions/database");
const { generateNextID } = require('../../functions/fleets/group');
const { generateRow, componentSingleUse } = require('../discord/actionHandler');
const { findIndex } = require('../../buildings');

const domains = [
    {label: "Space", value: "Space", emoji: false, default: false},
    {label: "Air", value: "Air", emoji: false, default: false},
    {label: "Sea", value: "Sea", emoji: false, default: false},
    {label: "Land", value: "Land", emoji: false, default: false},
];

const domainMenu = (f) => [
    {
        action: "menu",
        placeholder: "Vehicle Domain",
        id: "domain",
        type: "string",
        values: domains,
        minCount: 1,
        maxCount: 4,

        function: f
    }
]

const registerCancelRow = (reg, cancel) => [
    {
        action: "button",
        label: "Register",
        id: "register",
        style: "Success",
        emoji: false,
        disabled: false,

        function: reg
    },
    {
        action: "button",
        label: "Cancel",
        id: "cancel",
        style: "Danger",
        emoji: false,
        disabled: false,

        function: cancel
    },
]

const cancel = (str) => async (i) => {
    if ("update" in i)
        await i.update({content: str, components: []});
    else
        await i.editReply({ccontent: str, components: []});
}

const registrationController = async (interaction, faction, name, vehicleData, cost, domain, str) => {
    if (!faction || name === 'ship' || name === 'vehicle') {
        interaction.reply({content: str, components: []});
        return;
    }

    const server = interaction.guild.name;

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        interaction.reply({content: str, components: []});
        return;
    }

    const replaceIdx = factionData.Vehicles.findIndex(veh => veh.name === name);

    const success = async (i) => {
        try {
            const success = await register(server, faction, factionData, name, vehicleData, cost, domain, replaceIdx);
            if (success === 'fail') throw "How did you do this?";

            i.update({
                content: `${faction} has registered the ${name}`,
                components: []
            })
        } catch (e) {
            console.log(e);
            i.update({
                content: `Encountered an error: ${e}`,
                components: []
            });
        }
    }

    const controls = registerCancelRow(success, cancel(str));

    const response = await interaction.reply({
        content: str + `\nDo you want to ${replaceIdx >= 0 ? 'reregister':'register'} the ${name} class into ${faction}?`,
        components: [generateRow(controls)]
    });

    const filter = (i) => i.user.id === interaction.user.id

    const cancelAfterUse = () => cancel(str)(interaction)
    componentSingleUse(controls, 10*60000, cancelAfterUse, filter)(response)
    
}

const register = async (server, faction, factionData, name, vehicleData, cost, domain, replaceIdx) => {
    
    
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const newTimestamp = Timestamp.fromDate(new Date(today));

    if (typeof replaceIdx === 'number' && replaceIdx >= 0) {
        const vehicle = factionData.Vehicles[replaceIdx];
        vehicle.cost = cost;
        vehicle.domain = domain;
        vehicle.data = vehicleData;

        setFaction(server, faction, factionData)

        return 'reregister'
    }

    const newID = generateNextID(factionData.Vehicles);

    const newVehicles = [
        ...factionData.Vehicles,
        {
            ID: newID,
            name,
            domain,
            cost,
            data: vehicleData,
            date: newTimestamp,
        }
    ];

    setFaction(server, faction, {Vehicles: newVehicles});

    return 'register'
}

module.exports = { registrationController, register };