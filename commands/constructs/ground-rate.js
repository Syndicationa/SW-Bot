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
	{name: "name", description: "Name", type: "String", required: false, default: 'vehicle'},
]

const command = new SlashCommandBuilder().setName('ground-rate').setDescription('Rate Ground Vehicles (no trains, sorry)');
generateInputs(command, inputs);

const armorCosts = { //Costs are seemingly inverted
    heavy: {ER: 24, CM: 90, EL: 30, CS: 40},
    medium: {ER: 26, CM: 50, EL: 20, CS: 30},
    light: {ER: 40, CM: 30, EL: 12.5, CS: 20},
    none: {ER: 100, CM: 20, EL: 10, CS: 10}
}

const protectionCosts = { //Not inverted
    both: {ER: 0.3, CM: 20, EL: 25},
    hard: {ER: 0.15, CM: 10, EL: 10},
    soft: {ER: 0.1, CM: 5, EL: 15},
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

    return Math.ceil(systemCostER*(lengthCostER + heavyCostER + mediumCostER + lightCostER + rocketCostER)*100)/100;
}

const cm = (values) => {
    const {length, armor, protection, heavy, medium, light, rocket, systems} = values;

    const lengthCostCM = length**2 / 8.5 + armorCosts[armor].CM + protectionCosts[protection].CM;
    
    const heavyCostCM = heavy*10;
    const mediumCostCM = medium*2;
    const lightCostCM = light*0.3;
    const rocketCostCM = rocket;

    const systemCostCM = systems + 1;

    return Math.ceil(systemCostCM*(lengthCostCM + heavyCostCM + mediumCostCM + lightCostCM + rocketCostCM)*20)/100;
}

const el = (values) => {
    const {length, armor, protection, heavy, medium, light, rocket, systems} = values;

    const lengthCostEL = 3*(length**2 / 85 + armorCosts[armor].EL + protectionCosts[protection].EL);
    
    const heavyCostEL = heavy*6;
    const mediumCostEL = medium*10;
    const lightCostEL = light*0.2;
    const rocketCostEL = rocket*0.2;

    const systemCostEL = systems*1.5 + 1;

    return Math.ceil(systemCostEL*(lengthCostEL + heavyCostEL + mediumCostEL + lightCostEL + rocketCostEL)*20)/100;
}

const cs = (values, costCM, costEL) => {
    const {armor, heavy, medium, light, rocket, systems} = values;
    
    const CSCostID = 
        (heavy > 0 || rocket > 0) ? 40 :
        (medium > 0) ? 30 :
        (light > 0) ? 20 : 10;
    
    const lengthCostCS =
        (CSCostID === 4 || armorCosts[armor].CS === 4) ? 50 :
        (CSCostID === 3 || armorCosts[armor].CS === 3) ? 30 :
        (CSCostID === 2 || armorCosts[armor].CS === 2) ? 15 : 10;

    const systemCostCS = systems*2.5;

    return Math.ceil((lengthCostCS + systemCostCS + 0.1*(costCM + costEL))*20)/100;
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

    return `The ${name} will cost about $${er(values)} million ER, ${costCM} CM, ${costEL} EL, and ${cs(values, costCM, costEL)} CS. It will have an upkeep of ${Math.ceil(cs(values, costCM, costEL)/6)} CS.`
} 

const ground = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(rateFunction(values));
    }
}

module.exports = ground;