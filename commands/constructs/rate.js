const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency } = require('../../functions/currency');

const inputs = [
    {name: "length", description: "Length of the Ship", type: "Number", required: true},

    {name: "main", description: "Primary Weapon Count", type: "Integer", required: false},
    {name: "secondary", description: "Secondary Weapon Count", type: "Integer", required: false},
    {name: "lances", description: "Lance-like Weapon Count", type: "Integer", required: false},
    {name: "pdc", description: "PDC-like Weapon Count", type: "Integer", required: false},
    {name: "torpedoes", description: "Torpedo/Missile Count", type: "Integer", required: false},

    {name: "shield", description: "Has a Shield", type: "Boolean", required: false},
    {name: "stealth", description: "Has Stealth", type: "Boolean", required: false},
	{name: "systems", description: "Additional systems", type: "Integer", required: false},

	{name: "engines", description: "4S 2M 1L", type: "String", required: false},
    {name: "ftl", description: "Specify type of FTL", type: "String", required: false, 
        choices: [{name: "External", value: "EXT"}, {name: "Internal", value: "INT"}, {name: "None", value: "NONE"}]},

    {name: "cargo", description: "Amount of cargo space (1 unit per meter)", type: "Integer", required: false},
    {name: "drone", description: "Is a drone", type: "Boolean", required: false},
    {name: "other", description: "Other Costs", type: "Integer", required: false},
	{name: "name", description: "Name", type: "String", required: false, default: 'ship'},
]

const command = new SlashCommandBuilder().setName('ship-rate').setDescription('Rate Spacecraft');
generateInputs(command, inputs);

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
        const ftlModifier = ftl === "None" ? 0 : (ftl === "INT" ? 20 : 10);  
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

const rateFunction = (values) => {
    const {
        length, main, secondary, 
        lances, pdc, torpedoes, 
        shield, stealth, 
        systems, engines, ftl, 
        cargo, drone, other, name} = values;
    
    const correctedFTL = ftl ?? "NONE";
    const correctedStealth = stealth ?? false
    const correctedMain = main ?? 0;
    const correctedSecondary = secondary ?? 0;
    const correctedLances = lances ?? 0;
    const correctedPDCs = pdc ?? 0;
    const correctedTorpedoes = torpedoes ?? 0;
    
    const correctedOther = other ?? 0;
    const correctedShields = shield ?? false;
	const correctedSystems = systems ?? 0;

    const correctedCargo = cargo ?? 0;
    const correctedDrone = drone ?? false;

    const correctedEngines = splitCurrency(engines ?? "0", "M");

    const correctedValues = {
        length,
        main: correctedMain,
        secondary: correctedSecondary,
        lances: correctedLances,
        pdc: correctedPDCs,
        torpedoes: correctedTorpedoes,
        shield: correctedShields,
        stealth: correctedStealth,
        systems: correctedSystems,
        engines: correctedEngines,
        ftl: correctedFTL,
        cargo: correctedCargo,
        drone: correctedDrone,
        other: correctedOther,
    }

    return `The ${name} will cost about $${er(correctedValues)} billion ER, ${Math.ceil(cm(correctedValues))} CM, ${Math.ceil(el(correctedValues))} EL, and ${Math.ceil(cs((correctedValues)))} CS. It will have an upkeep of ${Math.ceil(cs((correctedValues))/6)} CS.`
}

const rate = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(rateFunction(values));
    }
}

module.exports = rate;
