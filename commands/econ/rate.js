const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');

const inputs = [
    {name: "length", description: "Length of the Ship", type: "Number", required: true},
    {name: "main", description: "Primary Weapon Count", type: "Integer", required: true},
    {name: "lances", description: "Lance-like Weapon Count", type: "Integer", required: true},
    {name: "pdc", description: "PDC-like Weapoin Count", type: "Integer", required: true},
    {name: "torpedoes", description: "Torpedo/Missile Count", type: "Integer", required: true},
    {name: "hangar", description: "Hangar Spaces", type: "Integer", required: true},
    {name: "shield", description: "Has a Shield", type: "Boolean", required: true},
    {name: "stealth", description: "Has Stealth", type: "Boolean", required: true},
    {name: "other", description: "Other Costs", type: "Integer", required: false},
]

const command = new SlashCommandBuilder().setName('rate').setDescription('Rate Spacecraft');
generateInputs(command, inputs);

const rateFunction = (values) => {
    const {length, main, lances, pdc, torpedoes, hangar, shield, stealth, other} = values;
    const lCost = length*(24 + (stealth ? 2: 0));
    const mCost = main*15;
    const lanCost = lances*50;
    const pCost = pdc*5;
    const tCost = torpedoes*5;
    const hCost = hangar*125;
    const oCost = other ?? 0;
    const sCost = shield ? 300:0;
    const cost = lCost + mCost + lanCost + pCost + tCost + hCost + sCost + oCost;
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
