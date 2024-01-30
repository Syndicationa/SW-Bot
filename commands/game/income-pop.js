const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { handleCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const IncPopLog = log('IncPop')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "treasury", description: "Treasury size", type: "String", required: true},
	{name: "population", description: "Population size", type: "String", required: true},
]

const runIncPop = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, treasury, population} = arguments;
	const treasure = handleCurrency(treasury);
	const pop = handleCurrency(population);
    const server = interaction.guild.name;
    let rawIncome, percentile;
    
    if (treasure <= 250000000000) {
        percentile = 1;
    } else if (treasure <= 15000000000000 && treasure > 250000000000) {
        percentile = (-0.0061*( treasure/1000000000 -250)+100)/100;
    } else if (treasure > 15000000000000){
        percentile = ((-((Math.log10((treasure/1000000000 -5699)))/2))+12.0095)/100;
    }

    if (pop <= 2000000000) {
        rawIncome = (125/1000000000)* pop *1000000;
    } else {
        rawIncome = ((1.7*(Math.log10((pop +1))))**2)*1000000000;
    }
    const amount = (rawIncome * percentile / 1000000000).toFixed(3);
	const embed = new EmbedBuilder().setTitle(`Income`).setColor(0x0099FF).setDescription(
		`${faction} has an income of ${amount}bil.`);
	await interaction.reply({ embeds: [ embed ] });
}

const command = new SlashCommandBuilder().setName('incomepop').setDescription('TEST');
generateInputs(command, inputs);

const IncPop = {
    data: command,
    execute: runIncPop
}

module.exports = IncPop;
