const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
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
	{name: "individual_cost", description: "Cost of 1 soldier. Use only when recruiting", type: "String", required: true},
	
	{name: "time", description: "Time to finish the process. Add months or weeks", type: "String", required: true},
	{name: "name", description: "MOS", type: "String", required: false, default: "soldiers"},
]

const runrecruit = async (interaction) => {
	const {faction, process, amount: newAmount, individual_cost, time, name} = retrieveInputs(interaction.options, inputs);
	const server = interaction.guild.name;

    const factionData = await getFaction(server, faction);
    const settings = await getFaction(server, 'settings');
    if (factionData === undefined) {
        error = 'Faction not found';
        recruitLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    
    const costs = splitCurrency(individual_cost);

    const NaNCosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
    if (NaNCosts || !isValidType || costs === undefined) {
        error = 'Error in amount';
        buyLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    
    const resources = factionData.Resources;
    const newResources = {};
    
    costs.forEach(async (cost) => {
            const [amount, resourceName] = cost;
            
            const nVal = resources[resourceName] - ( process == "dimiss" ? 0 : amount * newAmount[0][0]);
            
            if (nVal < 0) {
                error = 'Not enough funds';
                buyLog({arguments, error});
                await interaction.reply(error);
                return;
            }
            newResources[resourceName] = nVal;
            
        })

        if (Object.keys(newResources).length !== Object.keys(costs).length) return;

    
    
    const name1 = "Military";
    const name2 = "Population";
    if (process === "recruit") {
        const nValarmy = resources[name1] + newAmount[0][0];
        const nValpop = resources[name2] - newAmount[0][0];
        console.log(newAmount);
        console.log(newAmount[0][0]);
        if (nValarmy < 0 || nValpop < 0) {
            error = 'Your military/population cannot be below 0';
            recruitLog({arguments, error});
            await interaction.reply(error);
            return;
        }
        
        newResources[name1] = nValarmy;
        newResources[name2] = nValpop;
        
        
    }
    setFaction(server, faction, {Resources: {...resources, ...newResources}});
	const embed = new EmbedBuilder().setTitle(`${faction}'s military`).setColor(0x0099FF).setTimestamp().setDescription(
		`${faction} successfully ${process}ed ${newAmount[0][0]} ${name} for $${individual_cost} each.\nThey'll be ready in ${time}.\n1 irl week ~~ 3 irp months`);
		
	await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('recruit').setDescription('recruit or dimiss soldiers');
generateInputs(command, inputs);

const recruit = {
    data: command,
    execute: runrecruit
}

module.exports = recruit;
