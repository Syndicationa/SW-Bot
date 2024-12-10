const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');

const inputs = [
    {name: "length", description: "Length of vehicle", type: "Number", required: true},

    {name: "armor", description: "Level of armor", type: "String", required: false,
        choices: [{name: "None", value: "none"}, {name: "Light", value: "light"}, {name: "Medium", value: "medium"}, {name: "Heavy", value: "heavy"}], default: "none"},
    
    {name: "protection", description: "Active Protection System", type: "String", required: false,
        choices: [{name: "None", value: "none"}, {name: "Soft Kill APS", value: "soft"}, {name: "Hard Kill APS", value: "hard"}, {name: "Soft and Hard Kill APS", value: "both"}], default: "none"},

    {name: "heavy", description: "Heavy Armament, includes cannons 100mm and above, rockets 130mm and above, long range missiles", type: "Integer", required: false, default: 0},
    {name: "medium", description: "Medium Armament, includes cannons up to 99mm, short range missiles", type: "Integer", required: false, default: 0},
    {name: "light", description: "Light Armament, includes machine guns, grenade launchers up to 40mm", type: "Integer", required: false, default: 0},
    {name: "rocket", description: "Rocket Armament, unguided rockets up to 130mm caliber", type: "Integer", required: false, default: 0},
    {name: "systems", description: "Systems", type: "Integer", required: false, default: 0},
	{name: "name", description: "Name", type: "String", required: false, default: 'missile'},
]

const command = new SlashCommandBuilder().setName('ground-rate').setDescription('Rate Ground Vehicles (no trains, sorry)');
generateInputs(command, inputs);

const armorCosts = { //Costs are seemingly inverted
    heavy: {ER: 24, CM: 9, EL: 3, CS: 4},
    medium: {ER: 26, CM: 5, EL: 2, CS: 3},
    light: {ER: 40, CM: 3, EL: 1.25, CS: 2},
    none: {ER: 100, CM: 2, EL: 1, CS: 1}
}

const protectionCosts = { //Not inverted
    both: {ER: 0.3, CM: 2, EL: 2.5},
    hard: {ER: 0.15, CM: 1, EL: 1},
    soft: {ER: 0.1, CM: 0.5, EL: 1.5},
    none: {ER: 0, CM: 0, EL: 0}
}

const er = (values) => {
    const {length, armor, protection, heavy, medium, light, rocket, systems} = values;

    const weaponSystemCost = 
        (heavy > 0) ? 7 :
        (medium > 0) ? 3 : 0;

    const lengthCostER = length**2 / (armorCosts[armor].ER - weaponSystemCost);

    const heavyCostER = heavy*0.9;
    const mediumCostER = medium*0.3;
    const lightCostER = light*0.03;
    const rocketCostER = rocket*0.08;

    const systemCostER = 1 + systems*0.1 + protectionCosts[protection].ER;

    return Math.ceil(systemCostER*(lengthCostER + heavyCostER + mediumCostER + lightCostER + rocketCostER)*20) / 20;
}

const cm = (values) => {
    const {length, armor, protection, heavy, medium, light, rocket, systems} = values;

    const lengthCostCM = length**2 / 85 + armorCosts[armor].CM + protectionCosts[protection].CM;
    
    const heavyCostCM = heavy*1;
    const mediumCostCM = medium*0.2;
    const lightCostCM = light*0.03;
    const rocketCostCM = rocket*0.1;

    const systemCostCM = systems*0.1 + 1;

    return Math.ceil(systemCostCM*(lengthCostCM + heavyCostCM + mediumCostCM + lightCostCM + rocketCostCM)*2) / 2;
}

const el = (values) => {
    const {length, armor, protection, heavy, medium, light, rocket, systems} = values;

    const lengthCostEL = 0.3*(length**2 / 85 + armorCosts[armor].EL + protectionCosts[protection].EL);
    
    const heavyCostEL = heavy*0.6;
    const mediumCostEL = medium*1;
    const lightCostEL = light*0.02;
    const rocketCostEL = rocket*0.02;

    const systemCostEL = systems*0.15 + 1;

    return Math.ceil(systemCostEL*(lengthCostEL + heavyCostEL + mediumCostEL + lightCostEL + rocketCostEL)*2) / 2;
}

const cs = (values, costCM, costEL) => {
    const {armor, heavy, medium, light, rocket, systems} = values;
    
    const CSCostID = 
        (heavy > 0 || rocket > 0) ? 4 :
        (medium > 0) ? 3 :
        (light > 0) ? 2 : 1;
    
    const lengthCostCS =
        (CSCostID === 4 || armorCosts[armor].CS === 4) ? 5 :
        (CSCostID === 3 || armorCosts[armor].CS === 3) ? 3 :
        (CSCostID === 2 || armorCosts[armor].CS === 2) ? 1.5 : 1;

    const systemCostCS = systems*0.25;

    return Math.ceil((lengthCostCS + systemCostCS + 0.1*(costCM + costEL))*2)/2;
}

const rateFunction = (values) => {
    const {name} = values;
    
    // const correctedArmor = armor ?? "none";
    // const correctedProtection = protection ?? "none"

    // const correctedHeavy = heavy ?? 0;
    // const correctedMedium = medium ?? 0;
    // const correctedLight = light ?? 0;
    // const correctedRocket = rocket ?? 0;

    // const correctedSystems = systems ?? 0;


    // const correctedValues = {
    //     length, 
    //     armor: correctedArmor,
    //     protection: correctedProtection, 
    //     heavy: correctedHeavy,
    //     medium: correctedMedium,
    //     light: correctedLight,
    //     rocket: correctedRocket,
    //     systems: correctedSystems,
    // }

    const costCM = cm(values)
    const costEL = el(values)

    return `The ${name} will cost about $${er(values)} million ER, ${costCM*200} CM, ${costEL*200} EL, and ${cs(values, costCM, costEL)*200} CS. It will have an upkeep of ${Math.ceil(cs(values, costCM, costEL)*200/6)} CS.`
} 

const ground = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(rateFunction(values));
    }
}

module.exports = ground;