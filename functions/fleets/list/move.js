const { Timestamp } = require("firebase-admin/firestore");
const { setFaction } = require("../../database");
const { updateCSCost } = require("../group");

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "id", description: "Name or ID of fleet", type: "String", required: false},
    {name: "location", description: "Location", type: "String", required: false}
];

const handleInputs = (listState, inputs) => {
    const {"new-name": name, id} = inputs;
    const fleets = listState.fleetData;
    listState.name = name;
    listState.allSingleButtons = [];
    
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

const activate = (listState, print) => (interaction) => {
    const waitTimeMax = 3 * 7 * 24 * 60 * 60 * 1000;

    const server = interaction.guild.name;
    const {faction, fleetData: fleets, selectedFleet} = listState;
    const fleet = fleets[selectedFleet];

    const {Start, Location, Action} = fleet.State;
    if (Action !== "Mothballed") throw "Oh no!";

    const startDate = Start.toDate();
    const now = new Date();

    const timeBetween = now - startDate;
    const waitTime = Math.max(waitTimeMax, timeBetween / 4); //Will need to separate out

    const Activation = Timestamp.fromMillis(now.getTime() + waitTime);

    fleet.State = {Action: "Activating", Location, Activation};
    updateCSCost(fleet);

    setFaction(server, faction, {Fleets: fleets}); //To be honest this is evil

    //It needs to call the handler

    actionSetup(listState);
    interaction.update(print());
};

const mothball = (listState, print) => (interaction) => {
    const server = interaction.guild.name;
    const {faction, fleetData: fleets, selectedFleet} = listState;
    const fleet = fleets[selectedFleet];

    const {Location, Action} = fleet.State;
    if (Action !== "Defense" && Action !== "Activating") throw "Oh no!";

    let nowDate = new Date();
    if (Action === "Activating") {
        // Now + 4*(Future - Now) -> 4*Future - 3*Now
        nowDate = new Date(4*fleet.State.Activation.toDate().getTime() - 3*nowDate.getTime())
    }

    const now = Timestamp.fromDate(nowDate);

    fleet.State = {Action: "Mothballed", Location, Start: now};
    updateCSCost(fleet);

    setFaction(server, faction, {Fleets: fleets}); //To be honest this is evil

    actionSetup(listState);
    interaction.update(print());
}

const cancel = (interaction, collector) => {
    collector.stop();
    
    interaction.update({
        content: `Interaction closed!`,
        components: []
    })
}

const actionButtons = (back, listState, print) => {
    const activateButton = {
        action: "button",
        label: "Activate Fleet",
        id: "activate",
        style: "Secondary",
        disabled: false,

        function: activate(listState, print)
    };

    const mothballButton = {
        action: "button",
        label: "Mothball Fleet",
        id: "mothball",
        style: "Secondary",
        disabled: false,

        function: mothball(listState, print)
    }

    const backButton = {
        action: "button",
        label: "Back",
        id: "back",
        style: "Secondary",
        disabled: false,

        function: back
    };

    const cancelButton = {
        action: "button",
        label: "X",
        id: "cancel",
        style: "Danger",
        disabled: false,

        function: cancel
    };

    return [activateButton, mothballButton, backButton, cancelButton];
};

const actionSetup = (listState) => {
    if (listState.allSingleButtons.length === 0)
        listState.allSingleButtons = listState.singleButtons;

    const {fleetData: fleets, selectedFleet} = listState;
    const fleet = fleets[selectedFleet];

    const [activate, mothball, back, cancel] = listState.allSingleButtons;

    switch (fleet.State.Action) {
        case "Defense":
        case "Activating":
            listState.singleButtons = [mothball, back, cancel];
            break;
        case "Mothballed":
            listState.singleButtons = [activate, back, cancel];
            break;
        default:
            listState.singleButtons = [back, cancel];
    }
}

const actionPrint = (listState) => {
    if (listState.singleButtons.length === 4) setupSingleFleetList(listState);
    const { fleetData, selectedFleet, singleButtons } = listState;

    const fleet = fleetData[selectedFleet];
    let str;

    switch (fleet.State.Action) {
        case "Defense":
        case "Activating":
            str = `Do you want to mothball ${fleet.Name}?`;
            break;
        case "Mothballed":
            str = `Do you want to activate ${fleet.Name}?\nActivation Time: ${0}`;
            break;
        default:
            str = `${fleet.Name} not in state to mothball or activate`;
    }

    return [str, [singleButtons]];
}

module.exports = {
    inputs,
    handleOtherInputs: handleInputs,
    buttons: actionButtons,
    setup: actionSetup,
    print: actionPrint
}