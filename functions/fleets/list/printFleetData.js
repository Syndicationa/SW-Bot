const { handleReturnMultiple } = require("../../currency");

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
            throw 'Errorenous fleet state';
    }

    return Name.slice(0,12).padEnd(14) + State.Action.padEnd(12) + stateStr;
}

const singleVehicle = (vehicle, factionDatas) => {
    const {faction, count, ID} = vehicle;

    const name = factionDatas[faction].Vehicles.find((item) => item.ID === ID).name;

    return `${name.slice(0,12).padEnd(14)}|${("" + count).slice(0,8).padStart(10)} ${faction}`
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
    const {Name, State, CSCost, Vehicles, Value} = fleet;

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
            throw 'Errorenous fleet state';
    }

    const price = Vehicles.length === 0 ? "I am going to shoot you!": `Valued: ${handleReturnMultiple(Value, undefined, ", ")}`;
    const consuming = `Consuming ${CSCost} CS`
    const tableMessage = `Class          Count      Faction`;
    const tableLine = "-".repeat(tableMessage.length);
    const fleetStrs = Vehicles.map((v) => singleVehicle(v, factionDatas));

    const pages = [[]];
    let charCount = 0;
    
    let page = pages[0];

    const intro = [Name + " ", status, price, consuming, tableMessage, tableLine].join("\n");
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

module.exports = {
    singleFleet, singleVehicle, listFleets, listVehicles, formatRowWithIndicator
};