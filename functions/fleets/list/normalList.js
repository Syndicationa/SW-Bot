const { listVehicles } = require("./printFleetData");
const pageController = require("../../pageButtons");

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true}
];

const updatePage = (listState, print) => (interaction, pageNumber, buttons) => {
    listState.page = pageNumber;
    listState.pageButtons = buttons;

    interaction.update(print())
}

const singleListButtons = (back) => [
    {
        action: "button",
        label: "Back",
        id: "back",
        style: "Secondary",
        disabled: false,

        function: back
    },
]

const setupSingleFleetList = (listState, print) => {
    const {fleetData, factionDatas, selectedFleet, vehiclePages} = listState;

    listState.single = listVehicles(fleetData[selectedFleet], factionDatas);
    listState.pageButtons = pageController(listState.single[1].length, updatePage(listState, print));
}

const singleFleetPrint = (listState) => {
    const { page, single: [vehicleIntro, vehiclePages], singleButtons, pageButtons } = listState;

    return [vehicleIntro + "\n" + vehiclePages[0].join("\n"), [singleButtons, pageButtons]];
}

module.exports = {
    inputs,
    handleOtherInputs: (listState, inputs, factionData) => {},
    buttons: singleListButtons,
    setup: setupSingleFleetList,
    print: singleFleetPrint
}