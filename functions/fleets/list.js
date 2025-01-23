const { getFaction, getFactions } = require("../database");
const pageController = require("../pageButtons");
const { generateRow } = require('../discord/actionHandler');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true}
];

const singleFleet = (fleet) => {
    const {Name, Vehicles, State, CSCost} = fleet;

    const vehicleCount = Vehicles.reduce((count, vehicle) => count + vehicle.count,0);

    let stateStr;
    switch (State.Action) {
        case "Move":
            stateStr = `Target: ${State.Destination} Arrival at ${State.end}`;
            break;

        case "Defense":
        case "Battle":
            stateStr = `Location: ${State.Location}`;
            break;

        case "Activating":
            stateStr = `Location: ${State.Location} Active at ${State.Activation}`;
            break;

        case "Mothballed":
            stateStr = `Location: ${State.Location} Mothballed since ${State.Start}`;
            break;

        default:
            throw 'Errorenous vehicle state';
    }

    return Name.slice(0,12).padEnd(14) + State.Action.padEnd(12) + stateStr;
}

const singleVehicle = (vehicle, factionDatas) => {
    const {faction, count, id} = vehicle;

    const name = factionDatas[faction].Vehicles[id].name;

    return `${name.slice(0,12).padEnd(14)}|${("" + count).slice(0,8).padStart(10)}${faction}`
}

const listFleets = (fleets) => {
    const tableMessage = `Fleets         State       Information`;
    const tableLine = "-".repeat(tableMessage.length);
    const fleetStrs = fleets.map(singleFleet);

    const pages = [[]];
    let charCount = 0;

    let page = pages[0];

    const intro = [tableMessage, tableLine].join("\n");
    charCount = intro.length;

    for (const str of fleetStrs) {
        charCount += str.length + 2; //Adds select character and new line

        if (charCount > 1994) {//2000 character limit - 6 for the block statement
            pages.push([]);
            page = pages[pages.length - 1];
            charCount = intro.length + str.length + 2;
        }

        page.push(str);
    }

    return [intro, pages];
}

const listVehicles = (fleet, factionDatas) => {
    const {Name, State, CSCost, Vehicles} = fleet;

    let status = "Status: ";
    switch (State.Action) {
        case "Move":
            status += `Moving to ${State.Destination} arrival at ${State.end}`;
            break;

        case "Defense":
            status += `Defending ${State.Location}`
            break;
        case "Battle":
            status += `Fighting battle around ${State.Location}`;
            break;

        case "Activating":
            stateStr = `Activating around ${State.Location}. Ready at ${State.Activation}`;
            break;

        case "Mothballed":
            stateStr = `Mothballed around ${State.Location}. Mothballed since ${State.Start}`;
            break;

        default:
            throw 'Errorenous vehicle state';
    }

    const consuming = `Consuming ${CSCost} CS`
    const tableMessage = `Class          Count      Faction`;
    const tableLine = "-".repeat(tableMessage.length);
    const fleetStrs = Vehicles.map((v) => singleVehicle(v, factionDatas));

    const pages = [[]];
    let charCount = 0;
    
    let page = pages[0];

    const intro = [Name + " ", status, consuming, tableMessage, tableLine].join("\n");
    charCount = intro.length;

    for (const str of fleetStrs) {
        charCount += str.length + 1; //Adds one for the new line

        if (charCount > 1994) {//2000 character limit - 6 for the block statement
            pages.push([]);
            page = pages[pages.length - 1];
            charCount = intro.length + str.length + 1;
        }

        page.push(str);
    }

    return [intro, pages];
};

const formatRowWithIndicator = (pageRows, index) => {
    const output = [];
    for (let i = 0; i < pageRows.length; i++) {
        output[i] = (i === index ? ">":" ") + pageRows[i];
    };

    return output.join("\n");
}

const fleetListButtons = (up, down, select) => [
    {
        action: "button",
        label: "⬆",
        id: "up",
        style: "Secondary",
        disabled: false,

        function: up
    },
    {
        action: "button",
        label: "⬇",
        id: "down",
        style: "Secondary",
        disabled: false,

        function: down
    },
    {
        action: "button",
        label: "Select",
        id: "select",
        style: "Secondary",
        disabled: false,

        function: select
    },
];

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

const updatePage = (listState, print) => (interaction, pageNumber, buttons) => {
    listState.page = pageNumber;
    listState.pageButtons = buttons;

    interaction.update(print())
}

const moveSelector = (listState, dir, print) => (interaction) => {
    const size = listState.fleetsPages[listState.page].length;
    listState.selectedOnPage = (listState.selectedOnPage + dir + size) % size;

    interaction.update(print())
}

const select = (listState, print) => (interaction) => {
    const {page, offsets, selectedOnPage, fleetData, factionDatas} = listState;

    listState.state = "Single";
    listState.fleetPage = page;
    listState.selectedFleet = offsets[page] + selectedOnPage;
    [listState.vehicleIntro, listState.vehiclePages] = listVehicles(fleetData[listState.selectedFleet], factionDatas);
    listState.pageButtons = pageController(listState.vehiclePages.length, updatePage(listState, print));

    interaction.update(print())
}

const cancel = (listState, print) => (interaction) => {
    const {fleetPage, fleetsPages} = listState;

    listState.state = "All";
    listState.page = fleetPage;
    listState.pageButtons = pageController(fleetsPages.length, updatePage(listState, print), fleetPage);

    interaction.update(print())
}

const print = (listState) => () => {
    const {state, page, selectedOnPage,
        fleetsIntro, fleetsPages,
        vehicleIntro, vehiclePages,
        
        fleetButtons, singleButtons,
        pageButtons,
    } = listState;
    
    let str = "```";
    let components;

    switch (state) {
        case "All":
            str += fleetsIntro + "\n" + formatRowWithIndicator(fleetsPages[page], selectedOnPage);
            components = [fleetButtons, pageButtons];
            break;
        case "Single":
            str += vehicleIntro + "\n" + vehiclePages[page].join("\n");
            components = [singleButtons, pageButtons];
            break;
        default: 
            throw "Broken";
    }

    str += "```"

    components = components.map((list) => generateRow(list));

    return {
        content: str,
        components
    };
}

const list = async (server, {faction}) => {
    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        listBLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionDatas = getFactions(server);
    
    const [intro, fleets] = listFleets(factionData.Fleets);
    let tOffset = 0;
    let offsets = fleets.map((page) => {
        tOffset += page.length;
        return tOffset - page.length;
    })

    const listState = {
        state: "All",
        fleetsIntro: intro,
        fleetsPages: fleets,
        fleetData: factionData.Fleets,

        factionDatas,
        
        fleetPage: 0, //For temporary storage
        page: 0,
        selectedOnPage: 0,
        offsets,

        selectedFleet: -1,
        vehicleIntro: null,
        vehiclePages: null,

        fleetButtons: null,
        singleButtons: null,

        pageButtons: null
    };

    const localPrint = print(listState);

    listState.pageButtons = pageController(fleets.length, updatePage(listState, localPrint));

    const up = moveSelector(listState, -1, localPrint);
    const down = moveSelector(listState, 1, localPrint);
    const pick = select(listState, localPrint);
    const back = cancel(listState, localPrint);

    listState.fleetButtons = fleetListButtons(up, down, pick);
    listState.singleButtons = singleListButtons(back);

    const out = localPrint();

    return [out.content, [listState.fleetButtons, listState.pageButtons], [listState.fleetButtons, listState.pageButtons, listState.singleButtons]]
}

module.exports = {inputs, list};