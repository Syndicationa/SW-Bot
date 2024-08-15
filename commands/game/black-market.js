const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const bMarketLog = log('bMarket')

const randInt = (lower, higher) => Math.floor((Math.random()*(higher-lower)) + lower)

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
	{name: "choice", description: "What you'd like to purchase", type: "String", required: true,
		choices: [{name: "1x Pirate Immunity - 10 contraband", value: "immunity"}, {name: "1x Pirate redirection - 15 contraband", value: "redirection"}, {name: "2000 of any resource - 1 contraband", value: "resourceChoice"}]},
	{name: "target", description: "Name of the Faction chosen (and location) or abreviated name of the resource", type: "String", required: false},
]

const runbMarket = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, choice, target} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");
    
	const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        bMarketLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;
    const newResources = {};
	
	let output = "";
	let nVal = "";
	const entry = randInt(0,10);
	if(entry <= 3) {
		output = "Entry to the black market denied";
	}else if (entry == 9) {
		output = `Entry to the black market denied, ${faction}. You'll pay for trying to infiltrate us!`;
		nVal = resources[`ER`] - 50000000000;
		newResources[`ER`] = nVal;
		setFaction(server, faction, {Resources: {...resources, ...newResources}});
	} else {
		switch(choice){
			case "immunity":
				output = `${faction} has been granted a 1 time use immunity against pirates by bribing them with contraband.`;
				break;
			case "redirection":
				output = `The pirates have been bribed and directed to ${target}, they'll attack soon...`;
				break;
			case "resourceChoice":
				output = `${faction} traded 1 contraband for 2000 ${target} at the black market, well, for most of it at least.`;
				nVal = resources[target] + randInt(1500, 2000);
				newResources[target] = nVal;
				setFaction(server, faction, {Resources: {...resources, ...newResources}});
				break;
		
		}
		
	}
	
	const embed = new EmbedBuilder().setTitle(`unknown merchant`).setColor(0x0099FF).setDescription(
		`${output}`).setThumbnail('attachment://pirateflag.png').setTimestamp();
		
	await interaction.channel.send({ embeds: [ embed ],files: ['./files/pirateflag.png'] });
}

const command = new SlashCommandBuilder().setName('black-market').setDescription('Access the black market at your own risk');
generateInputs(command, inputs);

const bMarket = {
    data: command,
    execute: runbMarket
}

module.exports = bMarket;
