const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction, getFactionNames } = require('../../functions/database');
const { log, objectMap } = require('../../functions/log');
const { objectFilter } = require('../../functions/functions');

const pirateLog = log('pirate')

const inputs = [

]

const randInt = (lower, higher) => Math.floor((Math.random()*(higher-lower)) + lower)

const randItem = (array) => array[randInt(0, array.length)];

const runpirate = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;

    const settings = await getFaction(server, "Settings");

    let title = "";
	let message = "";

	if (randInt(0,5) !== 4) {
		let loop = true;
		let nations = getFactionNames(server);
		while (loop) {
			loop = false;

			const chosenNation = randItem(nations);
			title = ` on ${chosenNation}`;
			const target = await getFaction(server, chosenNation);
			if (chosenNation === undefined) throw Error();
			else if (typeof target.Maps !== 'object') {
				loop = true;
			}
			const world = randItem(Object.keys(objectFilter(target.Maps, (data) => data.Hexes > 1)));
			if (world === undefined) {
				loop = true;
			};
			message = `Pirates are preparing to raid ${chosenNation} on ${world}\n`; 

		}
	} else {
		const planet = randItem(settings.PlaceList);
		title = ` on ${planet}`;
		message = `Pirates are preparing to raid ${planet}\n`;
	}


	const embed = new EmbedBuilder().setTitle(`Pirate raid${title}`).setColor(0x0099FF).setDescription(
		`${message}`).setImage('attachment://pirates.png').setThumbnail('attachment://pirateflag.png').setTimestamp();
		
	await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('pirate-roll').setDescription('Manage pirate raids');
generateInputs(command, inputs);

const pirate = {
    data: command,
    execute: runpirate
}

module.exports = pirate;