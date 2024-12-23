const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');

const inputs = [
    {name: "length", description: "Length of vehicle", type: "Number", required: true},

    {name: "type", description: "Level of armor", type: "String", required: true,
        choices: [{name: "Cruise", value: "cruise"}, {name: "Ground to Orbit", value: "gto"}, {name: "Inter Planetary", value: "ip"}, {name: "Ballistic", value: "ballistic"}, {name: "Interceptor", value: "interceptor"}], default: "none"},
   
    {name: "nuclear", description: "Amount in kilotons", type: "Integer", required: false, default: 0},
    {name: "systems", description: "Systems", type: "Integer", required: false, default: 0},
	{name: "name", description: "Name", type: "String", required: false, default: 'missile'},
]

const command = new SlashCommandBuilder().setName('missile-rate').setDescription('Rate Missiles');
generateInputs(command, inputs);

const typeCosts = { //Costs are seemingly inverted
    interceptor: {ER: 4.2, CM: 23, EL: 19, CS: 18},
    ballistic: {ER: 67, CM: 89, EL: 52, CS: 62},
    ip: {ER: 79, CM: 87, EL: 65, CS: 72},
    gto: {ER: 67, CM: 45, EL: 54, CS: 42},
	cruise: {ER: 1.5, CM: 45, EL: 13, CS: 06}
}

const er = (values) => {
    const {length, type, nuclear, systems, name} = values;


    const lengthCostER = length*1.7;

    const typeCostER = typeCosts[type].ER;

    const nuclearER = nuclear*8.6;

    return Math.ceil((lengthCostER+typeCostER+nuclearER)/2);
}

const cm = (values) => {
    const {length, type, nuclear, systems, name} = values;


    const lengthCostCM = length*3.8;

    const typeCostCM = typeCosts[type].CM;

    const nuclearCM = nuclear*16;

    return Math.ceil((lengthCostCM+typeCostCM+nuclearCM)/2);
}

const el = (values) => {
    const {length, type, nuclear, systems, name} = values;

    const typeCostEL = typeCosts[type].EL;

    const nuclearEL = nuclear*8;
	
	const systemsEL = 2.5*typeCosts[type].EL*systems;
	
    return Math.ceil((typeCostEL+nuclearEL+systemsEL)/2);
}

const cs = (values) => {
    const {length, type, nuclear, systems, name} = values;


    const lengthCostCS = length*1.6;

    const typeCostCS = typeCosts[type].CS;

    const nuclearCS = nuclear*3.5;

    return Math.ceil((lengthCostCS+typeCostCS+nuclearCS)/2);

}

const rateFunction = (values) => {
    const {length, type, nuclear, systems, name} = values;
    
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

    return `The ${name} will cost about $${er(values)} million ER, ${el(values)} CM, ${cs(values)} EL, and ${cs(values)} CS. It will have an upkeep of ${Math.ceil(cs(values)/6)} CS.`
} 

const missile = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(rateFunction(values));
    }
}

module.exports = missile;