const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { scaleResources, subResources, maxResources, equResources, roundResources } = require('../../functions/resourceMath');
const { addVehicles, valueGroup } = require('../../functions/fleets/group');
const { list } = require('../../functions/fleets/list');
const { generateRow, componentCollector } = require('../../functions/discord/actionHandler');

const buyLog = log('buy')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "index", description: "Vehicle to be bought", type: "Integer", required: true},
    {name: "amount", description: "Number to be built", type: "Integer", required: true},
    {name: "owner", description: "Name of the faction who made the vehicle", type: "String", required: false, default: ""},
    {name: "fleet-id", description: "Fleet ID", type: "String", required: false},
]

const updateListState = (id, vehicles, name) => (listState) => {
    const fleets = listState.fleetData;
    listState.vehicles = vehicles;
    listState.name = name;
    listState.allSingleButtons = [];
    
    if (id === undefined) return;
    
    let IDNumber = Math.round(Number(id));
    if (isNaN(IDNumber)) {
        IDNumber = fleets.findIndex((fleet) => fleet.Name.toLowerCase() === id.toLowerCase());
    } else {
        IDNumber--;
    }

    if (IDNumber < 0 || IDNumber >= fleets.length) return;

    listState.state = "Single";
    listState.selectedFleet = IDNumber;
}

const add = (listState) => (interaction, collector) => {
    const server = interaction.guild.name;
    const {faction, factionDatas, fleetData: fleets, selectedFleet, vehicles, name} = listState;

    const fleet = fleets[selectedFleet];
    addVehicles(fleet, [vehicles]);

    const factions = new Set();
    fleet.Vehicles.forEach(element => factions.add(element.faction));
    factions.add(vehicles.faction);

    let vehicleDataMap = new Map();
    for (const name of factions) {
        for (const vehicle of factionDatas[name].Vehicles) {
            vehicleDataMap.set(`${name}<>${vehicle.ID}`, vehicle);
        }
    }

    valueGroup(vehicleDataMap, fleet)
    
    setFaction(server, faction, {Fleets: fleets}); //To be honest this is evil
    
    collector.stop();
    
    interaction.update({
        content: `You have bought ${vehicles.count} ${name}`,
        components: []
    })
}

const cancel = (interaction, collector) => {
    collector.stop();
    
    interaction.update({
        content: `Didn't buy vehicles!`,
        components: []
    })
}

const buyButtons = (back, listState) => [
    {
        action: "button",
        label: "Buy Vehicles",
        id: "buy",
        style: "Success",
        disabled: false,

        function: add(listState)
    },
    {
        action: "button",
        label: "Back",
        id: "back",
        style: "Secondary",
        disabled: false,

        function: back
    },
    {
        action: "button",
        label: "X",
        id: "cancel",
        style: "Danger",
        disabled: false,

        function: cancel
    }
]

const singleFleetPrint = (listState) => {
    const { fleetData, selectedFleet, singleButtons, name, vehicles } = listState;

    return [`Buy ${vehicles.count} ${name} for ${fleetData[selectedFleet].Name}`, [singleButtons]];
}

const runBuy = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, owner, index, amount, "fleet-id": fleet} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const factionData = await getFaction(server, faction);
    const ownerData = owner === "" ? factionData : await getFaction(server, owner)

    if (factionData === undefined) {
        error = 'Faction not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (ownerData === undefined) {
        error = 'Owner faction not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (ownerData.Vehicles[index] === undefined) {
        error = 'Vehicle not found';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const vehicle = ownerData.Vehicles[index];

    const costs = scaleResources(vehicle.cost, amount);

    const NaNCosts = Object.keys(costs).some((res) => isNaN(costs[res]));
    if (NaNCosts || costs === undefined) {
        error = 'Error in cost';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const vehicleData = {
        faction: (owner || faction).toLowerCase(),
        ID: vehicle.ID,
        count: amount
    };

    const listing = {
        handleOtherInputs: updateListState(fleet, vehicleData, vehicle.name),
        buttons: buyButtons,
        setup: () => {},
        print: singleFleetPrint
    }

    const [resultStr, components, allComponents] = await list(server, arguments, listing);
    
    const result = await interaction.reply({
        content: resultStr,
        components: components.map((row) => generateRow(row))
    });

    if (components.length === 0) return;

    const basicFilter = (i) => i.user.id === interaction.user.id

    const shutdown = async (_, reason) => {
        if (reason === 'user') return;
        await interaction.editReply({content: `Failed to buy!`, components: []});
    }

    componentCollector(allComponents.flat(), 720_000, shutdown, basicFilter)(result);
}

const command = new SlashCommandBuilder().setName('buy-free').setDescription('Get Vehicles');
generateInputs(command, inputs);

const buy = {
    data: command,
    execute: runBuy
}

module.exports = buy;
