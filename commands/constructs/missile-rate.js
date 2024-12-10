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
    interceptor: {ER: 4.2, CM: 2.3, EL: 1.9, CS: 1.8},
    ballistic: {ER: 67, CM: 8.9, EL: 5.2, CS: 6.2},
    ip: {ER: 79, CM: 8.7, EL: 6.5, CS: 7.2},
    gto: {ER: 67, CM: 4.5, EL: 5.4, CS: 4.2},
	cruise: {ER: 1.5, CM: 4.5, EL: 1.3, CS: 0.6}
}

const er = (values) => {
    const {length, type, nuclear, systems, name} = values;


    const lengthCostER = length*1.7;

    const typeCostER = typeCosts[type].ER;

    const nuclearER = nuclear*8.6;

    return Math.ceil(lengthCostER+typeCostER+nuclearER);
}

const cm = (values) => {
    const {length, type, nuclear, systems, name} = values;


    const lengthCostCM = length*0.38;

    const typeCostCM = typeCosts[type].CM;

    const nuclearCM = nuclear*1.6;

    return Math.ceil(lengthCostCM+typeCostCM+nuclearCM);
}

const el = (values) => {
    const {length, type, nuclear, systems, name} = values;

    const typeCostEL = typeCosts[type].EL;

    const nuclearEL = nuclear*0.8;
	
	const systemsEL = 0.25*typeCosts[type].EL*systems;
	
    return Math.ceil(typeCostEL+nuclearEL+systemsEL);
}

const cs = (values) => {
    const {length, type, nuclear, systems, name} = values;


    const lengthCostCS = length*0.16;

    const typeCostCS = typeCosts[type].CS;

    const nuclearCS = nuclear*0.35;

    return Math.ceil(lengthCostCS+typeCostCS+nuclearCS);

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