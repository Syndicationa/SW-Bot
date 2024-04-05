const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');

const inputs = [
    {name: "length", description: "Length of the craft", type: "Number", required: true},
	{name: "armour", description: "Has armour", type: "Boolean", required: false},
    {name: "main", description: "Primary Weapon Count", type: "Integer", required: false},
    {name: "bombs", description: "Bomb Weapon Count", type: "Integer", required: false},
    {name: "torpedoes", description: "Torpedo/Missile Count", type: "Integer", required: false},
    {name: "shield", description: "Has a Shield", type: "Boolean", required: false},
    {name: "stealth", description: "Has Stealth", type: "Boolean", required: false},
	{name: "systems", description: "Additional systems", type: "Integer", required: false},
	{name: "engines", description: "Small engines count", type: "Integer", required: false},
	{name: "atmospheric", description: "Is atmospheric (non-hybrid)", type: "Boolean", required: false},
	{name: "hybrid", description: "Is a air/space hybrid", type: "Boolean", required: false},
	{name: "drone", description: "Is a drone", type: "Boolean", required: false},
    {name: "other", description: "Other Costs", type: "Integer", required: false},
]

const command = new SlashCommandBuilder().setName('small-rate').setDescription('Rate Smaller Craft');
generateInputs(command, inputs);

const rateFunction = (values) => {
    const {
        length, armour, main, 
        bombs, torpedoes, shield, 
        stealth, systems, engines, 
        atmospheric, hybrid, drone, other} = values;
    
    const lCost = length*(3 + (stealth ? 1.5: 0));
	const arCost = ((armour ?? false) ? 2.5:0)*length;
    const mCost = (main ?? 0)*2;
    const bCost = (bombs ?? 0);
    const tCost = (torpedoes ?? 0)*2.5;
    const oCost = other ?? 0;
    const sCost = (shield ?? false) ? 10:0;
	const syCost = (systems ?? 0) * length * 0.235;
	const eCost = (engines ?? 0)*5;

    const generatedCost = lCost + arCost + mCost + bCost + tCost + sCost + syCost + eCost + oCost;

    const aCost = (atmospheric ?? false) ? 0.85:1;
    const hCost = (hybrid ?? false) ? 1.15:1;
	const dCost = (drone ?? false) ? 0.85:1;

    const costModification = aCost*dCost*hCost;

    const cost = generatedCost*costModification;
    return cost;
}

const srate = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(`This will cost about $${rateFunction(values)} million`);
    }
}

module.exports = srate;
