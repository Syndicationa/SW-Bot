const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');

const inputs = [
    {name: "length", description: "Length of the Ship", type: "Number", required: true},
    {name: "main", description: "Primary Weapon Count", type: "Integer", required: false},
    {name: "secondary", description: "Secondary Weapon Count", type: "Integer", required: false},
    {name: "lances", description: "Lance-like Weapon Count", type: "Integer", required: false},
    {name: "pdc", description: "PDC-like Weapoin Count", type: "Integer", required: false},
    {name: "torpedoes", description: "Torpedo/Missile Count", type: "Integer", required: false},
    {name: "fighters", description: "Cost of Carried Fighters", type: "Integer", required: false},
    {name: "shield", description: "Has a Shield", type: "Boolean", required: false},
    {name: "stealth", description: "Has Stealth", type: "Boolean", required: false},
    {name: "other", description: "Other Costs", type: "Integer", required: false},
]

const command = new SlashCommandBuilder().setName('rate').setDescription('Rate Spacecraft');
generateInputs(command, inputs);

const rateFunction = (values) => {
    const {length, main, secondary, lances, pdc, torpedoes, hangar, shield, stealth, other} = values;
    const lCost = length*(24 + (stealth ? 2: 0));
    const mCost = main*15 ?? 0;
    const seCost = secondary*10 ?? 0;
    const lanCost = lances*50 ?? 0;
    const pCost = pdc*5 ?? 0;
    const tCost = torpedoes*5 ?? 0;
    const hCost = hangar*125 ?? 0;
    const oCost = other ?? 0;
    const sCost = shield ? 300:0;
    const cost = lCost + mCost + seCost + lanCost + pCost + tCost + hCost + sCost + oCost;
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
