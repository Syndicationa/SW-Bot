const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');

const inputs = [
    {name: "length", description: "Length of the Ship", type: "Number", required: true},

    {name: "armor", description: "Specify type of armor", type: "String", required: false, 
        choices: [{name: "Heavy", value: "heavy"}, {name: "Medium", value: "medium"}, {name: "Light", value: "light"}, {name: "None", value: "none"}]},
    {name: "protection", description: "Active Protection Systems", type: "String", required: false, 
        choices: [{name: "Hard Kill", value: "hard"}, {name: "Soft Kill", value: "soft"}, {name: "Both", value: "both"}, {name: "None", value: "none"}]},

    {name: "heavy", description: "Heavy Weapon Count", type: "Integer", required: false},
    {name: "medium", description: "Medium Weapon Count", type: "Integer", required: false},
    {name: "light", description: "Light Weapon Count", type: "Integer", required: false},
    {name: "rocket", description: "Unguided Rocket Weapon Count", type: "Integer", required: false},

	{name: "systems", description: "Additional systems", type: "Integer", required: false},
]

const command = new SlashCommandBuilder().setName('ground-rate').setDescription('Rate Ground Vehicle');
generateInputs(command, inputs);

const armorCosts = { //Costs are seemingly inverted
    heavy: {ER: 24},
    medium: {ER: 26},
    light: {ER: 40},
    none: {ER: 100}
}

const protectionCosts = { //Not inverted
    both: {ER: 0.3},
    hard: {ER: 0.15},
    soft: {ER: 0.1},
    none: {ER: 0}
}

const er = (values) => {
    const {length, armor, protection, heavy, medium, light, rocket, systems} = values;

    const weaponSystemCost = 
        (heavy > 0) ? 7 :
        (medium > 0) ? 3 : 0;

    const armorValue = armorCosts[armor].ER;
    const lengthCost = length**2 / (armorValue - weaponSystemCost);

    const heavyCost = heavy*0.9;
    const mediumCost = medium*0.3;
    const lightCost = light*0.03;
    const rocketCost = rocket*0.08;

    const systemCost = 1 + systems*0.1 + protectionCosts[protection].ER;

    return lengthCost + heavyCost + mediumCost + lightCost + rocketCost + systemCost;
}

const cm = (values) => {
    return 0;
    // const {
    //     length, main, secondary, 
    //     lances, pdc, torpedoes, 
    //     shield, stealth, 
    //     systems, engines, ftl, 
    //     cargo, drone, other} = values;
    // const ftlModifier = ftl === "NONE" ? 0 : (ftl === "INT" ? 6 : 4); 
    // const lCost = length*(5 + (stealth ? 2: 0) + ftlModifier);
    
    // const mCost = main*10;
    // const seCost = secondary*5;
    // const lanCost = lances*30;
    // const pCost = pdc*2.5;
    // const tCost = torpedoes*2.5;
    
    // const sCost = shield ? 100:0;
	// const sysCost = systems * length / 10;

    // const cargoCost = cargo * 5;
    // const droneDiscount = drone ? 1.2:1;

    // const engineCosts = {S: 5, M: 7, L: 10};
    // const engineCost = engines.reduce((acc, [count, type]) => 
    //     (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);

    // return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + cargoCost)*droneDiscount;
}

const el = (values) => {
    return 0;
    // const {
    //     length, main, secondary, 
    //     lances, pdc, torpedoes, 
    //     shield, stealth, 
    //     systems, engines, ftl, 
    //     cargo, drone, other} = values;
    //     const ftlModifier = ftl === "None" ? 0 : (ftl === "INT" ? 2 : 1);  
    // const lCost = length*((stealth ? 1: 0) + ftlModifier);
    
    // const mCost = main*10;
    // const seCost = secondary*10;
    // const lanCost = lances*20;
    // const pCost = pdc*10;
    // const tCost = torpedoes*10;
    
    // const sCost = shield ? 100:0;
	// const sysCost = systems * length/5;

    // const cargoCost = cargo * 2;
    // const droneDiscount = drone ? 1.5:1;

    // const engineCosts = {S: 5, M: 7, L: 10};
    // const engineCost = engines.reduce((acc, [count, type]) => 
    //     (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);

    // return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + cargoCost)*droneDiscount;
}

const cs = (values) => {
    return 0;
    // const {
    //     length, main, secondary, 
    //     lances, pdc,
    //     systems, engines, ftl, 
    //     drone} = values;
    // const ftlModifier = ftl === "NONE" ? 0: 1; 
    // const lCost = length*(0.5 + ftlModifier);
    
    // const mCost = main*1;
    // const seCost = secondary*1;
    // const lanCost = lances*2;
    // const pCost = pdc*1;

	// const sysCost = systems * length / 5;

    // const droneDiscount = drone ? 0.5:1;

    // const engineCosts = {S: 1, M: 2, L: 3};
    // const engineCost = engines.reduce((acc, [count, type]) => 
    //     (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);

    // return (lCost + mCost + seCost + lanCost + pCost + sysCost + engineCost)*droneDiscount;
}

const rateFunction = (values) => {
    const {length, armor, protection, heavy, medium, light, rocket, systems} = values;
    
    const correctedArmor = armor ?? "none";
    const correctedProtection = protection ?? "none"

    const correctedHeavy = heavy ?? 0;
    const correctedMedium = medium ?? 0;
    const correctedLight = light ?? 0;
    const correctedRocket = rocket ?? 0;

	const correctedSystems = systems ?? 0;

    const correctedValues = {
        length, 
        armor: correctedArmor,
        protection: correctedProtection, 
        heavy: correctedHeavy,
        medium: correctedMedium,
        light: correctedLight,
        rocket: correctedRocket,
        systems: correctedSystems
    }

    return `This will cost about $${er(correctedValues)} million ER, ${cm(correctedValues)} CM, ${el(correctedValues)} EL, and ${cs((correctedValues))} CS`
}

const ground = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(rateFunction(values));
    }
}

module.exports = ground;
