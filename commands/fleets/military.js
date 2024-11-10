const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const recruitLog = log('recruit')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "process", description: "Specify recruiting or dimissing troops", type: "String", required: true, 
        choices: [{name: "Recruit", value: "recruit"}, {name: "Dimiss", value: "dimiss"}]},
    {name: "amount", description: "Amount of troops(add a m, b, or t as multipliers, no unit)", type: "String", required: true},
	{name: "time", description: "Time to finish the process", type: "String", required: true},
]

const runrecruit = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, process, amount, time} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        recruitLog({arguments, error});
        await interaction.reply(error);
        return;
    }
	
	const fix = amount + " Military";
	error = fix;
	recruitLog({arguments, error});
	const newAmount = splitCurrency(fix);
	error = newAmount;
	recruitLog({arguments, error});
    const resources = factionData.Resources;
    const newResources = {};
	const name1 = "Military";
	const name2 = "Population";
	if (process === "recruit") {
		const nValarmy = resources[name1] + newAmount[0][0];
		const nValpop = resources[name2] - newAmount[0][0];
		if (nValarmy < 0 || nValpop < 0) {
			error = 'Your military/population cannot be bellow 0';
			recruitLog({arguments, error});
			await interaction.reply(error);
			return;
		}
		
		newResources[name1] = nValarmy;
		newResources[name2] = nValpop;
	} else if (process === "dimiss") {
		const nValarmy = resources[name1] - newAmount[0][0];
		const nValpop = resources[name2] + newAmount[0][0];
		if (nValarmy < 0 || nValpop < 0) {
			error = 'Your military/population cannot be bellow 0';
			recruitLog({arguments, error});
			await interaction.reply(error);
			return;
		}
		
		newResources[name1] = nValarmy;
		newResources[name2] = nValpop;
	} else {
		error = 'Error in process, must be "recruit" or "dimiss"';
		recruitLog({arguments, error});
		await interaction.reply(error);
		return;
	}
	

    setFaction(server, faction, {Resources: {...resources, ...newResources}});
	const embed = new EmbedBuilder().setTitle(`${faction}'s military`).setColor(0x0099FF).setTimestamp().setDescription(
		`${faction} succesfully ${process}ed ${newAmount[0][0]} soldiers.\nThey'll be ready to fight in ${time}.\n1 irl week ~~ 3 irp months`);
		
	await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('recruit').setDescription('recruit or dimiss soldiers');
generateInputs(command, inputs);

const recruit = {
    data: command,
    execute: runrecruit
}

module.exports = recruit;
