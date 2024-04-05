const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');

const inputs = [
    {name: "length", description: "Length of the Ship", type: "Number", required: true},

    {name: "heavy-main", description: "Primary Weapon Count", type: "Integer", required: false},
    {name: "medium-main", description: "Secondary Weapon Count", type: "Integer", required: false},
    {name: "machine-gun", description: "Lance-like Weapon Count", type: "Integer", required: false},
    {name: "missile-launcher", description: "Torpedo/Missile Count", type: "Integer", required: false},

    {name: "shield", description: "Has a Shield", type: "Boolean", required: false},
    {name: "stealth", description: "Has Stealth", type: "Boolean", required: false},
	{name: "systems", description: "Additional systems", type: "Integer", required: false},

	{name: "small-armour", description: "Small armour count", type: "Boolean", required: false},
	{name: "medium-armour", description: "Medium armour count", type: "Boolean", required: false},
	{name: "large-armour", description: "Large armour count", type: "Boolean", required: false},
    
    {name: "other", description: "Other Costs", type: "Integer", required: false},
]

const command = new SlashCommandBuilder().setName('ground-rate').setDescription('Rate Ground Vehicles');
generateInputs(command, inputs);

const rateFunction = (values) => {
    const {
        length, 
        "heavy-main": heavyMain, "medium-main": mediumMain, 
        "machine-gun": machineGun, "missile-launcher": missileLauncher, 
        shield, stealth, systems, 
        "small-armour": smallArmour, "medium-armour": mediumArmour, "large-armour": largeArmour, other} = values;
    const lCost = length*(0.5 + (stealth ? 1.5: 0));
    const hmCost = (heavyMain ?? 0)*1;
    const mmCost = (mediumMain ?? 0)*0.5;
    const mgCost = (machineGun ?? 0)*0.25;
    const tCost = (missileLauncher ?? 0)*0.5;
    const oCost = other ?? 0;
    const sCost = (shield ?? false) ? 3:0;
	const syCost = (systems ?? 0) * length * 0.080;
	const asCost = (smallArmour ?? false)? 1:0;
	const amCost = (mediumArmour ?? false)? 2:0;
	const alCost = (largeArmour ?? false)? 3:0;
    const cost = lCost + hmCost + mmCost + mgCost + tCost + sCost + syCost + asCost + amCost + alCost + oCost;
    return cost;
}

const grate = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(`This will cost about $${rateFunction(values)} million`);
    }
}

module.exports = grate;
