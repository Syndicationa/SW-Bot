const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');

const beltLog = log('belt')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "cargocapacity", description: "Cargo capacity of the fleet", type: "Integer", required: true},
    {name: "escorts", description: "Does the fleet include any armed ships?", type: "Boolean", required: true},	
    {name: "fleetcost", description: "Cost of the escorting fleet", type: "Integer", required: false},
    {name: "fleetsize", description: "Size of the escorting fleet", type: "Integer", required: false},
];


const runBelt = async (interaction) => {
	const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, cargocapacity, escorts, fleetcost} = arguments;
	const server = interaction.guild.name;
	//victory/loss maths
	const randInt = (lower, higher) => Math.floor((Math.random()*(higher-lower)) + lower)

	const generatePirates = (escorts) => Math.random() >= ((escorts === false) ? 0.5: (1/3));

	const piratePower = () => randInt(5,fleetcost);
	
    const attacked = generatePirates(fleetcost);
	const death = Math.random() < ((fleetcost <= 50) ? 0.5: (1/10));
    const pirates = piratePower();
    const shipLoss = randInt(0, pirates);
    
    const cargo = randInt(0, cargocapacity + 1) *100;
    
    let message = "";
	let colour = "";
    
    if (!attacked) {
        message = `${faction}'s fleet has obtained $${cargo}mil during a peaceful mining mission to the belt.`;
		colour = 0x0099FF;
    } else if (!death) {
		message = `${faction}'s fleet has won a battle against pirates during the mining mission, winning $${cargo}mil, at the cost of $${shipLoss}bil worth of ships.`;
		colour = 0x008000;
    } else {
        message = `${faction}'s fleet has lost a battle against pirates during the mining mission, loosing it's ships and their cargo.`
		colour = 0xFF0000;
    }
    //database stuff
	const settings = await getFaction(server, "Settings");
    const money = cargo + "m";
    const costs = splitCurrency(money);
	console.log(costs);

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        beltLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = factionData.Resources;
    const newResources = {};

    costs.forEach(async (cost) => {
        const resourceName = cost[1]
        const amount = cost[0]
        const nVal = resources[resourceName] + amount;
        console.log(amount);
		console.log(resourceName);
		console.log(nVal)
        if (nVal < 0) {
            error = 'Not enough funds';
            beltLog({arguments, error});
            await interaction.reply(error);
            return;
        }

        newResources[resourceName] = nVal;
    })
    setFaction(server, faction, {Resources: {...resources, ...newResources}});
	let embed = new EmbedBuilder().setTitle('Belt Mining Mission').setColor(0x0099FF).setDescription(`${faction}'s fleet has embarked on a belt mining mission, it is expected to return in a minute`).setImage("https://imgur.com/s7G5sS6");
	interaction.channel.send({ embeds: [ embed ] });
	setTimeout(() => {
    embed = new EmbedBuilder().setTitle('Belt Mining Mission').setColor(colour).setDescription(message).setImage("https://imgur.com/s7G5sS6");
    interaction.channel.send({ embeds: [ embed ] });
	}, 60000)
}

const command = new SlashCommandBuilder().setName('belt-mining').setDescription('TEST BROKEN');
generateInputs(command, inputs);

const belt = {
    data: command,
    execute: runBelt
}

module.exports = belt;
