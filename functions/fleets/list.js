const { getFaction, getFactions } = require("../database");
const { listFleets, formatRowWithIndicator } = require("./list/printFleetData");
const pageController = require("../pageButtons");
const { generateRow } = require('../discord/actionHandler');
const defaultListing = require("./list/normalList");

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
    const {page, offsets, selectedOnPage} = listState;

    listState.state = "Single";
    listState.fleetPage = page;
    listState.selectedFleet = offsets[page] + selectedOnPage;
    listState.setup(listState);

    interaction.update(print())
}

const cancel = (listState, print) => (interaction) => {
    const {fleetPage, fleetsPages} = listState;

    listState.state = "All";
    listState.page = fleetPage;
    listState.pageButtons = pageController(fleetsPages.length, updatePage(listState, print), fleetPage);

    interaction.update(print())
}

const print = (listState) => (generateRows = true) => {
    const {state, page, selectedOnPage,
        fleetsIntro, fleetsPages,
        singlePrint,
        
        fleetButtons,
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
            let subStr;
            [subStr, components] = listState.singlePrint(listState);
            str += subStr;
            break;
        default: 
            throw "Broken";
    }

    str += "```"

    if (generateRows) components = components.map((list) => generateRow(list));

    return {
        content: str,
        components
    };
}

const list = async (server, inputs, listingSystem = defaultListing) => {
    const {faction} = inputs; 
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
        faction,

        fleetsIntro: intro,
        fleetsPages: fleets,
        fleetData: factionData.Fleets,

        factionDatas,
        
        fleetPage: 0, //For temporary storage
        page: 0,
        selectedOnPage: 0,
        offsets,

        selectedFleet: -1,

        single: null,
        setup: listingSystem.setup,
        singlePrint: listingSystem.print,

        fleetButtons: null,
        singleButtons: null,

        pageButtons: null
    };

    listingSystem.handleOtherInputs(listState, inputs, factionData);

    const localPrint = print(listState);

    listState.pageButtons = pageController(fleets.length, updatePage(listState, localPrint));

    const up = moveSelector(listState, -1, localPrint);
    const down = moveSelector(listState, 1, localPrint);
    const pick = select(listState, localPrint);
    const back = cancel(listState, localPrint);

    listState.fleetButtons = fleetListButtons(up, down, pick);
    listState.singleButtons = listingSystem.buttons(back, listState, localPrint);

    const out = localPrint(false);

    return [out.content, out.components, [listState.fleetButtons, listState.pageButtons, listState.singleButtons]]
}

module.exports = {list};