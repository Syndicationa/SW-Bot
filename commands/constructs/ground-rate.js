const commandBuilder = require("../../functions/discord/commandBuilder");
const { splitCurrency, resourceArrayToObject } = require('../../functions/currency');
const { registrationController } = require('../../functions/rating/register');

const name = "ground-rate";
const description = "Rate Ground Vehicles (no trains, sorry)";

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
	{name: "faction", description: "Faction", type: "String", required: false},
]

const command = {name, description, inputs};

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
        (heavy > 0 || rocket > 0) ? 4 :
        (medium > 0) ? 3 :
        (light > 0) ? 2 : 1;
    
    const lengthCostCS =
        (CSCostID === 4 || armorCosts[armor].CS === 4) ? 50 :
        (CSCostID === 3 || armorCosts[armor].CS === 3) ? 30 :
        (CSCostID === 2 || armorCosts[armor].CS === 2) ? 15 : 10;

    const systemCostCS = systems*2.5;

    return Math.ceil((lengthCostCS + systemCostCS + 0.1*(costCM + costEL))*20)/100;
}

const groundRate = (values) => {
    const costCM = cm(values);
    const costEL = el(values);

    return {
        ER: Math.ceil(er(values)*1000000),
        CM: Math.ceil(costCM),
        CS: Math.ceil(cs(values, costCM, costEL)),
        EL: Math.ceil(costEL)
    }
} 

const rate = (interaction, inputs) => {
    const {faction, name, ...vehicleData} = inputs;

    const cost = groundRate(vehicleData);
    
    const str = `The ${name} will cost about $${cost.ER} ER, ${cost.CM} CM, ${cost.EL} EL, and ${cost.CS} CS. It will have an upkeep of ${Math.ceil(cost.CS/6)} CS.`;
    
    registrationController(interaction, faction, name, vehicleData, cost, "Ground", str);
}

module.exports = commandBuilder(command, rate);