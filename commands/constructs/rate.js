const commandBuilder = require("../../functions/discord/commandBuilder");
const { splitCurrency, resourceArrayToObject } = require('../../functions/currency');
const { registrationController } = require('../../functions/rating/register');
const {handleReturnMultiple, handleReturn } = require('../../functions/currency');

const name = "ship-rate";
const description = "Rate Spacecraft";

const inputs = [
    {name: "length", description: "Length of the Ship", type: "Number", required: true},

    {name: "main", description: "Primary Weapon Count", type: "Integer", required: false, default: 0},
    {name: "secondary", description: "Secondary Weapon Count", type: "Integer", required: false, default: 0},
    {name: "lances", description: "Lance-like Weapon Count", type: "Integer", required: false, default: 0},
    {name: "pdc", description: "PDC-like Weapon Count", type: "Integer", required: false, default: 0},
    {name: "torpedoes", description: "Torpedo/Missile Count", type: "Integer", required: false, default: 0},

    {name: "shield", description: "Has a Shield", type: "Boolean", required: false, default: false},
    {name: "stealth", description: "Has Stealth", type: "Boolean", required: false, default: false},
	{name: "systems", description: "Additional systems", type: "Integer", required: false, default: 0},

	{name: "engines", description: "4S 2M 1L", type: "String", required: false},
    {name: "ftl", description: "Specify type of FTL", type: "String", required: false, default: "NONE",
        choices: [{name: "External", value: "EXT"}, {name: "Internal", value: "INT"}, {name: "None", value: "NONE"}]},

    {name: "cargo", description: "Amount of cargo space (1 unit per meter)", type: "Integer", required: false, default: 0},
    {name: "drone", description: "Is a drone", type: "Boolean", required: false, default: false},
    {name: "other", description: "Other Costs", type: "Integer", required: false, default: 0},

    {name: "boat", description: "Boat", type: "Boolean", required: false, default: false},
	{name: "name", description: "Name", type: "String", required: false, default: "ship"},
	{name: "faction", description: "Faction", type: "String", required: false},
]

const command = {name, description, inputs};

const er = (values) => {
    const {
        length, main, secondary, 
        lances, pdc, torpedoes, 
        shield, stealth, 
        systems, engines, ftl, 
        cargo, drone, other} = values;
    const ftlModifier = ftl === "NONE" ? 0: 1500; 
    const lCost = length*(24 + (stealth ? 2: 0) + ftlModifier);
    
    const mCost = main*15;
    const seCost = secondary*10;
    const lanCost = lances*50;
    const pCost = pdc*5;
    const tCost = torpedoes*5;
    
    const oCost = other;
    const sCost = shield ? 300:0;
	const sysCost = systems * length;

    const cargoCost = cargo * 1;
    const droneDiscount = drone ? 0.85:1;

    const engineCosts = {S: 5.5, M: 7.5, L: 10.5};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + oCost + cargoCost)*droneDiscount/1000;
}

const cm = (values) => {
    const {
        length, main, secondary, 
        lances, pdc, torpedoes, 
        shield, stealth, 
        systems, engines, ftl, 
        cargo, drone, other} = values;
    const ftlModifier = ftl === "NONE" ? 0 : (ftl === "INT" ? 60 : 40); 
    const lCost = length*(50 + (stealth ? 20: 0) + ftlModifier);
    
    const mCost = main*100;
    const seCost = secondary*50;
    const lanCost = lances*300;
    const pCost = pdc*25;
    const tCost = torpedoes*25;
    
    const sCost = shield ? 1000:0;
	const sysCost = systems * length;

    const cargoCost = cargo * 10;
    const droneDiscount = drone ? 1.2:1;

    const engineCosts = {S: 50, M: 70, L: 100};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + cargoCost)*droneDiscount;
}

const el = (values) => {
    const {
        length, main, secondary, 
        lances, pdc, torpedoes, 
        shield, stealth, 
        systems, engines, ftl, 
        cargo, drone, other} = values;
        const ftlModifier = ftl === "NONE" ? 0 : (ftl === "INT" ? 20 : 10);  
    const lCost = length*((stealth ? 10: 0) + ftlModifier);
    
    const mCost = main*100;
    const seCost = secondary*100;
    const lanCost = lances*200;
    const pCost = pdc*100;
    const tCost = torpedoes*100;
    
    const sCost = shield ? 1000:0;
	const sysCost = systems * length*2;

    const cargoCost = cargo * 5;
    const droneDiscount = drone ? 1.5:1;

    const engineCosts = {S: 50, M: 70, L: 100};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + cargoCost)*droneDiscount;
}

const cs = (values) => {
    const {
        length, main, secondary, 
        lances, pdc,
        systems, engines, ftl, 
        drone} = values;
    const ftlModifier = ftl === "NONE" ? 0: 10; 
    const lCost = length*(5 + ftlModifier);
    
    const mCost = main*10;
    const seCost = secondary*10;
    const lanCost = lances*20;
    const pCost = pdc*10;

	const sysCost = systems * length *2;

    const droneDiscount = drone ? 0.5:1;

    const engineCosts = {S: 10, M: 20, L: 30};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + sysCost + engineCost)*droneDiscount;
}

const spaceRate = (data) => {
    switch (typeof data.engines) {
        case "string":
            data.engines = splitCurrency(data.engines ?? "0", "M");
            break;
        case "object":
            if (Array.isArray(data.engines)) break;
            const newArray = [];

            for (const size in data.engines) {
                newArray.push([data.engines[size], size]);
            }

            inputs.engines = newArray;
            break;
        default: 
            throw "How did you manage this?";
    }

    const multiplier = data.boat ? 0.85 : 1;

    return {
        ER: Math.ceil(er(data)*1000000000*multiplier),
        CM: Math.ceil(cm(data)*multiplier),
        CS: Math.ceil(cs(data)*multiplier),
        EL: Math.ceil(el(data)*multiplier)
    }
}

const rate = (interaction, inputs) => {
    const {faction, name, ...vehicleData} = inputs;
    vehicleData.engines = splitCurrency(vehicleData.engines ?? "0", "M");

    const cost = spaceRate(vehicleData);

    vehicleData.engines = resourceArrayToObject(vehicleData.engines);

    const str = `The ${name} will cost about ${handleReturnMultiple(cost, undefined, ", ")} CS. It will have an upkeep of ${handleReturn(Math.ceil(cost.CS/6))} CS.`;

    if (vehicleData.boat)
        registrationController(interaction, faction, name, vehicleData, cost, "Sea", str);
    else
        registrationController(interaction, faction, name, vehicleData, cost, "Space", str);
}

module.exports = commandBuilder(command, rate);
