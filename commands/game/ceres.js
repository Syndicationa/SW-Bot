const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple, handleReturn } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const CeresLog = log('Ceres')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
	{name: "choice", description: "Type of resource to receive (CM, CS or EL)", type: "String", required: true,
		choices: [{name: "CM", value: "CM"}, {name: "CS", value: "CS"}, {name: "EL", value: "EL"}]},
	{name: "payment", description: "Amount of funds(add a m, b, or t as multipliers) of resources", type: "String", required: true},
	
]

const runCeres = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, choice, payment} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");
    
    const gain = choice;
	
	const costs = splitCurrency(payment).filter(([_, name]) => name === "EL" || name === "CM" || name === "CS").map(([val, name]) => [val - (val % 4), name]);

    const NaNcosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNcosts || !isValidType || costs === undefined) {
        error = 'Error in amount';
        CeresLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        CeresLog({arguments, error});
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
            CeresLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newResources[resourceName] = nVal;
    })
	
	const gainAmount = costs.reduce((acc, [amount]) => acc + amount, 0)/4;
	
	const nVal = resources[gain] + gainAmount;
    newResources[gain] = nVal;

    setFaction(server, faction, {Resources: {...resources, ...newResources}});
	const embed = new EmbedBuilder().setTitle(`Ceres Station`).setColor(0x0099FF).setDescription(
		`Welcome to Ceres, ${faction}!\nWe have the best prices of the system...\nBuy any resource for 4 other resources!\n\nYou've bought ${handleReturn(gainAmount)} ${gain}\nfor ${handleReturnMultiple(costs, settings.Resources)}.`).setImage('attachment://Ceres.png').setThumbnail('attachment://cereslogo.png').setTimestamp();
		
	await interaction.reply({ embeds: [ embed ],});
}

const command = new SlashCommandBuilder().setName('ceres').setDescription('Access the Ceres trading market');
generateInputs(command, inputs);

const Ceres = {
    data: command,
    execute: runCeres
}

module.exports = Ceres;
