const { addResources, scaleResources } = require("./resourceMath");

const exampleVehicle = {
    ID: 0,
    date: new Date(), 
    name: "NAME", 
    cost: {}, 
    count: 0
}

const calculateValue = (vehicles, fleet) => {
    const orderedVehicles = []
    vehicles.forEach((vehicle) => orderedVehicles[vehicle.ID] = vehicle);

    const cost = fleet.Vehicles.reduce((acc, {Count, ID}) => {
        return addResources(scaleResources(orderedVehicles[ID].cost, Count), acc)
    }, {});

    return cost;
}

const valueFleet = (vehicles, fleet, reservedCostModifier) => {
    const cost = calculateValue(vehicles, fleet);

    return {
        ...fleet,
        Value: cost,
        CSCost: cost.CS * (fleet.State.Action === "Reserved") ? reservedCostModifier:1,
    }
}

const states = [
    {Action: "Move", Source: "Place", Destination: "Place2", Start: new Date(), End: new Date()},
    {Action: "Defense", Location: "Earth"},
    {Action: "Battle", Location: "Earth", Enemies: [["Faction Name", `Fleet ID Number`]]},
    {Action: "Activating", Location: "Earth", Activation: new Date()},
    {Action: "Mothballed", Location: "Earth", Start: new Date()}
];

const exampleFleet = {
    ID: 0,
    Vehicles: [{Count: 0, ID: 1}],
    State: states[0],
    Value: {},
    CSCost: 0
};

const makeAFleet = (ID, vehicles, location) => {
    return {
        ID,
        Vehicles: vehicles,
        Location: {Action: "Defense", Location: location, Value: -1},
        CSCost: -1
    }
}

const joinATrade = (trade, member, priority) => {
    if (trade[member] === undefined) return false;
    if (!isNaN(trade[member].Priority)) return false;
    return {
        ...trade,
        [member]: {
            ...trade[member],
            Priority: priority
        }
    };
}

const generateNextID = (list) => {
    const sorted = list.sort((a, b) => a.ID - b.ID);
    
    for (let i = 0; i < sorted.length; i++)
        if (i < sorted[i].ID) return i;
    return sorted.length;
}

const findTrade = (list = [exampleTrade], ID) => list.find(trade => trade.ID === ID);

module.exports = {valueFleet, generateNextID, findTrade, joinATrade}