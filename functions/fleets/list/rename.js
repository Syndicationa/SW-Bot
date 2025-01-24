const { setFaction } = require("../../database");

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "new-name", description: "The new name of the fleet", type: "String", required: true},
    {name: "id", description: "Name or ID of fleet", type: "String", required: false}
];

const handleInputs = (listState, inputs) => {
    const {"new-name": name, id} = inputs;
    const fleets = listState.fleetData;
    listState.name = name;

    if (id === undefined) return;
    
    let IDNumber = Math.round(Number(id));
    if (isNaN(IDNumber)) {
        IDNumber = fleets.find((fleet) => fleet.Name.toLowerCase() === id.toLowerCase());
    } else {
        IDNumber--;
    }

    if (IDNumber < 0 || IDNumber >= fleets.length) return;

    listState.state = "Single";
    listState.selectedFleet = IDNumber;
}

const rename =  (listState) => (interaction, collector) => {
    const server = interaction.guild.name;
    const {faction, fleetData: fleets, selectedFleet, name} = listState;

    const fleet = fleets[selectedFleet];
    const oldName = fleet.Name;
    fleet.Name = name;
    setFaction(server, faction, {Fleets: fleets}); //To be honest this is evil
    
    collector.stop();
    
    interaction.update({
        content: `You have renamed ${oldName} to ${name}`,
        components: []
    }) //There may be a conflict
}

const renameButtons = (back, listState) => [
    {
        action: "button",
        label: "Rename Fleet",
        id: "rename",
        style: "Success",
        disabled: false,

        function: rename(listState)
    },
    {
        action: "button",
        label: "Back",
        id: "back",
        style: "Secondary",
        disabled: false,

        function: back
    },
]

const setupSingleFleetList = (listState) => {

}

const singleFleetPrint = (listState) => {
    const { fleetData, selectedFleet, singleButtons, name } = listState;

    return [`Rename ${fleetData[selectedFleet].Name} to ${name}?`, [singleButtons]];
}

module.exports = {
    inputs,
    handleOtherInputs: handleInputs,
    buttons: renameButtons,
    setup: setupSingleFleetList,
    print: singleFleetPrint
}