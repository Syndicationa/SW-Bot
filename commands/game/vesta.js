const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple, handleReturn } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const VestaLog = log('Vesta')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
	{name: "choice", description: "Type of resource to receive (CM, CS or EL)", type: "String", required: true,
		choices: [{name: "CM", value: "CM"}, {name: "CS", value: "CS"}, {name: "EL", value: "EL"}]},
	{name: "payment", description: "Amount of funds(add a m, b, or t as multipliers) of resources", type: "String", required: true},
	
]

const runVesta = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, choice, payment} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");
    
    const gain = choice;
	
	const costs = splitCurrency(payment).filter(([_, name]) => name === `U-${gain}`)

    const NaNcosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNcosts || !isValidType || costs === undefined) {
        error = 'Error in amount';
        VestaLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        VestaLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;
    const newResources = {};

	costs.forEach(async (cost) => {
        const resourceName = cost[1]
        const amount = cost[0]
        const nVal = resources[resourceName] - amount;
        
        if (nVal < 0) {
            error = 'Not enough funds';
            VestaLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newResources[resourceName] = nVal;
    })
	
	const gainAmount = costs.reduce((acc, [amount]) => acc + amount, 0)/4;
	
	const nVal = resources[gain] + gainAmount;
    newResources[gain] = nVal;

    setFaction(server, faction, {Resources: {...resources, ...newResources}});
	const embed = new EmbedBuilder().setTitle(`Vesta Station`).setColor(0x0099FF).setDescription(
		`Greetings ${faction}, what brings you to Vesta?\nWe'll refine anything you got!\nWe can only give you 1/4th of what what you give us, we got to make a living somehow y'know?\n\nYou've bought ${handleReturn(gainAmount)} ${gain}\nfor ${handleReturnMultiple(costs, settings.Resources)}.`).setImage('attachment://Ceres.png').setThumbnail('attachment://cereslogo.png').setTimestamp();
		
	await interaction.reply({ embeds: [ embed ],});
}

const command = new SlashCommandBuilder().setName('vesta').setDescription('Access the Vesta trading market');
generateInputs(command, inputs);

const Vesta = {
    data: command,
    execute: runVesta
}

module.exports = Vesta;
