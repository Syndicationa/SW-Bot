const { SlashCommandBuilder } = require('discord.js');
const { generateInputs, retrieveInputs } = require('../../functions/discord/optionHandler');
const { Timestamp } = require('firebase-admin/firestore');
const { getFaction, setFaction } = require("../../functions/database");
const { log } = require('../../functions/log');
const { generateRow, componentSingleUse } = require('../../functions/discord/actionHandler');

const regVLog = log('deregisterVehicle');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "id", description: "Vehicle ID", type: "Integer", required: true}
]

const registerCancelRow = (reg, cancel) => [
    {
        action: "button",
        label: "Deregister",
        id: "register",
        style: "Danger",
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

const deregister = async (server, faction, factionData, id) => {
    factionData.Vehicles.splice(id, 1);

    setFaction(server, faction, {Vehicles: factionData.Vehicles});

    return true
}

const runDeregisterVehicle = async (interaction) => {
    const {faction, id} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;

    const settings = await getFaction(server, "settings");
    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        regVLog({arguments: {faction}, error: 'Faction not found'})
        await interaction.reply('Faction not found');
        return;
    }

    const vehicleData = factionData.Vehicles[id];
    if (vehicleData === undefined) {
        regVLog({arguments: {faction, id}, error: 'Vehicle not found'});
        await interaction.reply('Vehicle not found');
        return
    }
    
    const name = vehicleData.name;

    const fleets = factionData.Fleets;
    let hasVehicle = false;
    for (const fleet of fleets) {
        for (const vehicle of fleet.Vehicles) {
            if (vehicle.faction === faction.toLowerCase() && vehicle.ID === vehicleData.ID) 
                hasVehicle = true;
        }
        if (hasVehicle) break;
    }

    if (hasVehicle) {
        await interaction.reply("Sorry, but this vehicle seems to be in use in a fleet");
        return;
    }
    
    const success = async (i) => {
        try {
            const success = await deregister(server, faction, factionData, id);
            if (!success) throw "How did you do this?";

            i.update({
                content: `${faction} has deregistered the ${name}`,
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

    const controls = registerCancelRow(success, cancel(`Canceled deregistration`));

    const response = await interaction.reply({
        content: `Do you want to deregister the ${name} class of ${faction}?`,
        components: [generateRow(controls)]
    });

    const filter = (i) => i.user.id === interaction.user.id

    const cancelAfterUse = () => cancel(`Cancelled`)(interaction)
    componentSingleUse(controls, 10*60000, cancelAfterUse, filter)(response)
}

const command = new SlashCommandBuilder().setName('deregister-vehicle').setDescription('Deregister a vehicle');
generateInputs(command, inputs);

module.exports = {
    data: command,
    execute: runDeregisterVehicle
}