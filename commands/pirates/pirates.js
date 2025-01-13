const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction, getFactionNames } = require('../../functions/database');
const { log, objectMap } = require('../../functions/log');

const pirateLog = log('pirate')

const inputs = [
    {name: "process", description: "Specify recruiting or dimissing troops", type: "String", required: true, 
        choices: [{name: "Roll", value: "roll"}, {name: "Start", value: "start"}, {name: "Victory", value: "victory"}, {name: "Defeat", value: "defeat"}]},
    {name: "value", description: "1 to 6 or 10, use only with start process", type: "String", required: false},
	{name: "faction", description: "use when using defeat process", type: "String", required: false},
]

const randInt = (lower, higher) => Math.floor((Math.random()*(higher-lower)) + lower)

const factionQualities = quality => {
    return () => true;
        
}

const runpirate = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    let {process, value, faction} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");

    let titleMessage = "";
	let interactionMessage = "";
	switch(process){
		
		case "roll":
			// const f = factionQualities(undefined);
			// let nations = getFactionNames(interaction.guild.name, f);
			let nations = ["mcr", "triad", "cer", "kkw", "arestika"];
			if(randInt(1,6) === 6) {
				nations = settings.PlaceList;
			} else if (randInt(1,5) > 3) {
				nations = getFactionNames(server);
			}
			const chosenOne = nations[randInt(0, nations.length - 1)];
			titleMessage = ` on ${chosenOne}`;
			interactionMessage = `Pirates are preparing to raid ${chosenOne}\n\n(Please define their stength and run this command with the start process)`; 
			break;
		case "start":
			let pirateFleet = "";
			pirateFleet = `${randInt(0,value*20)} Neptune-4,\n`;
			pirateFleet = pirateFleet + `${randInt(0,value*20)} Magpie II,\n`;
			pirateFleet = pirateFleet + `${randInt(value,value*50)} TC-2,\n`;
			pirateFleet = pirateFleet + `${randInt(value,value*30)} Ichó,\n`;
			pirateFleet = pirateFleet + `and ${randInt(value,value*100)} SP-W2.`;
			interactionMessage = `The pirate fleet consists of:\n${pirateFleet}`; 
			break;
		case "defeat":
			interactionMessage = `The pirate raid was successful and the defenders suffered damage and casualties.\nThe defenders lose half their income this week, and the pirates will be stronger next week!`
			if (faction === undefined) {
				faction = `void`;
			}
			const factionData = await getFaction(server, faction);
			if (factionData === undefined) {
				error = 'Faction not found';
				pirateLog({arguments, error});
				await interaction.reply(error);
				return;
			}
			const resources = factionData.Resources;
			const income = objectMap(factionData.Income, inc => inc);
			const newResources = {};
			const costs = splitCurrency(income);
			error = income;
			pirateLog({arguments, error});
			costs.forEach(async (cost) => {
				const resourceName = cost[1]
				const amount = cost[0]
				const nVal = resources[resourceName] - amount/2;
				error = costs;
				pirateLog({arguments, error});
				if (nVal < 0) {
					error = 'Not enough funds';
					pirateLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				newResources[resourceName] = nVal;
			})
			setFaction(server, faction, {Resources: {...resources, ...newResources}});
			break;
		case "victory":
			let contraband = randInt(0,2);
			if(contraband == 1)
				{
					contraband = randInt(1,3);
				}
			interactionMessage = `The pirate raid was defeated! Amongst the wrecks, ${contraband} crate(s) of contraband were found.`;
			break;
		
		default:
			interactionMessage = "test";
			break;
	}
	

    
	

	const embed = new EmbedBuilder().setTitle(`Pirate raid${titleMessage}`).setColor(0x0099FF).setDescription(
		`${interactionMessage}`).setImage('attachment://pirates.png').setThumbnail('attachment://pirateflag.png').setTimestamp();
		
	await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('pirate-raid').setDescription('Manage pirate raids');
generateInputs(command, inputs);

const pirate = {
    data: command,
    execute: runpirate
}

module.exports = pirate;
