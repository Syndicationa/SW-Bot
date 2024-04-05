const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency } = require('../../functions/currency');

const inputs = [
    {name: "length", description: "Length of the Ship", type: "Number", required: true},

    {name: "main", description: "Primary Weapon Count", type: "Integer", required: false},
    {name: "secondary", description: "Secondary Weapon Count", type: "Integer", required: false},
    {name: "lances", description: "Lance-like Weapon Count", type: "Integer", required: false},
    {name: "pdc", description: "PDC-like Weapon Count", type: "Integer", required: false},
    {name: "torpedoes", description: "Torpedo/Missile Count", type: "Integer", required: false},

    {name: "fighters", description: "Cost of Carried Fighters", type: "Integer", required: false},
    {name: "shield", description: "Has a Shield", type: "Boolean", required: false},
    {name: "stealth", description: "Has Stealth", type: "Boolean", required: false},
	{name: "systems", description: "Additional systems", type: "Integer", required: false},

	{name: "engines", description: "(count) (S/M/L) + (count) (S/M/L)", type: "String", required: false},

    {name: "other", description: "Other Costs", type: "Integer", required: false},
	{name: "drone", description: "Is a drone", type: "Boolean", required: false},
]

const command = new SlashCommandBuilder().setName('ship-rate').setDescription('Rate Spacecraft');
generateInputs(command, inputs);

const rateFunction = (values) => {
    const {length, main, secondary, lances, pdc, torpedoes, hangar, shield, stealth, systems, engines, drone, other} = values;
    
    const lCost = length*(24 + (stealth ? 2: 0));
    
    const mCost = (main ?? 0)*15;
    const seCost = (secondary ?? 0)*10;
    const lanCost = (lances ?? 0)*50;
    const pCost = (pdc ?? 0)*5;
    const tCost = (torpedoes ?? 0)*5;
    
    const hCost = (hangar ?? 0);
    const oCost = other ?? 0;
    const sCost = (shield ?? false) ? 300:0;
	const sysCost = (systems ?? 0) * length;

    const engineCounts = splitCurrency(engines, "M");
    const engineCosts = {S: 5.5, M: 7.5, L: 10.5};
    const engineCost = engineCounts.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc: acc + (count*engineCosts[type]), 0);
	
    
    const droneDiscount = (drone ?? false) ? 0.85:1;

    const generatedCost = 
        lCost + mCost + seCost + lanCost + pCost + tCost + hCost + sCost + sysCost + engineCost + oCost;

    const cost = generatedCost*droneDiscount;
    return cost/1000;
}

const rate = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(`This will cost about $${rateFunction(values)} billion`);
    }
}

module.exports = rate;
