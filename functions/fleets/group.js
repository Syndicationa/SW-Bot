const { addResources, scaleResources } = require("../resourceMath");

const states = [
    {Action: "Move", Source: "Place", Destination: "Place2", Start: new Date(), End: new Date()},
    {Action: "Defense", Location: "Earth"},
    {Action: "Battle", Location: "Earth", Battle: 0},
    {Action: "Activating", Location: "Earth", Activation: new Date()},
    {Action: "Mothballed", Location: "Earth", Start: new Date()}
];

const exampleGroup = {
    Name: "Example",
    ID: 0,
    Type: "Space",
    Vehicles: [{faction: "name", count: 0, ID: 1}],
    State: states[0],
    Value: {},
    CSCost: 0
};

const getFactions = (group) => {
    return Array.from(new Set(group.Vehicles.map(vehicle => vehicle.faction)));
}

const buildVehicleMap = (vehicleArr, map, faction) => {
    for (const vehicle of vehicleArr) {
        map.set(`${faction.toLowerCase()}<>${vehicle.ID}`, vehicle);
    }
}

const calculateValue = (vehicles = new Map(), group) => {
    const cost = group.Vehicles.reduce((acc, {count, faction, ID}) => {
        return addResources(scaleResources(vehicles.get(`${faction}<>${ID}`).cost, count), acc)
    }, {});

    return cost;
}

const valueGroup = (vehicles, group) => {
    const cost = calculateValue(vehicles, group);

    group.Value = cost;

    return updateCSCost(group);
}

const updateCSCost = (group) => {
    const action = group.State.Action;
    const CS = group.Value?.CS ?? 0

    let scale = 1/6;
    switch (action) {
        case "Mothballed":
            scale *= 0.25;
            break;
        case "Activating":
            break;
        default:
    }

    group.CSCost = Math.ceil(CS * scale);
    return group;
}

const makeAGroup = (name, ID, type, location) => {
    return {
        Name: name,
        ID,
        Type: type,
        Vehicles: [],
        State: {Action: "Defense", Location: location},
        Value: null,
        CSCost: 0
    }
}

const validDistance = (sourceLocation, targetLocation) => {
    if (sourceLocation === targetLocation) return true;
    //Add more here
    return false;
}

const validTransfer = (source, target) => {
    switch(source.State.Action) {
        case "Move":
            return false;
        case "Defense":
        case "Activating":
        case "Mothballed":
            return (
                (target.State.Action === "Defense"
                || target.State.Action === "Mothballed"
                || target.State.Action === "Activating")
                && validDistance(source.State.Location, target.State.Location)
            )
        case "Battle":
            return source.State.Battle === target.State.Battle
    }
};

const addVehicleToMap = (map = new Map()) => (vehicle) => {
    map.set(`${vehicle.faction}<>${vehicle.ID}`, vehicle.count)
}

const createVehicleArray = (map = new Map()) => {
    let arr = [];
    for (const [data, count] of map) {
        const [faction, numberStr] = data.split("<>");
        const ID = Number(numberStr);
        arr.push({faction, ID, count});
    }
    return arr;
}

const addVehicles = (target, vehicles) => {;
    const targetMap = new Map();
    const transferMap = new Map();

    target.Vehicles.forEach(addVehicleToMap(targetMap));
    vehicles.forEach(addVehicleToMap(transferMap));
    
    for (const [key, count] of transferMap) {
        targetMap.set(key, count + (targetMap.get(key) ?? 0));
    }

    target.Vehicles = createVehicleArray(targetMap);

    return target;
}

const transferVehicles = (source, target, vehicles) => {
    if (!validTransfer(source, target)) throw Error("Distance or States invalid");
    const sourceMap = new Map();
    const targetMap = new Map();
    const transferMap = new Map();

    source.Vehicles.forEach(addVehicleToMap(sourceMap));
    target.Vehicles.forEach(addVehicleToMap(targetMap));
    vehicles.forEach(addVehicleToMap(transferMap));
    
    for (const [key, count] of transferMap) {
        if (!sourceMap.has(key)) throw Error("Vehicle to tranfer is missing");
        sourceMap.set(key, count - sourceMap.get(key));
        targetMap.set(key, count + (targetMap.get(key) ?? 0));
    }

    return [{...source, Vehicles: createVehicleArray(sourceMap)}, {...target, Vehicles: createVehicleArray(targetMap)}];
}

const generateNextID = (list) => {
    const sorted = list.toSorted((a, b) => a.ID - b.ID);
    
    for (let i = 0; i < sorted.length; i++)
        if (i < sorted[i].ID) return i;
    return sorted.length;
}

const findGroup = (list = [exampleGroup], ID) => list.find(group => group.ID === ID);

module.exports = {states, getFactions, buildVehicleMap, valueGroup, updateCSCost, makeAGroup, addVehicles, transferVehicles, generateNextID, findGroup};