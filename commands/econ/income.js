const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { Timestamp } = require('firebase-admin/firestore');
const {getFaction, setFaction} = require("../../functions/database");
const { db } = require('../../firebase');
const { log } = require('../../functions/log');
const {handleReturnMultiple } = require('../../functions/currency');
const {objectMap} = require('../../functions/functions');

const incomeLog = log('income');

const inputs = [
    {name: "faction", description: "Faction to collect Income", type: "String", required: true},
]

const week = (7 * 24 * 60 * 60 * 1000);

const updateDate = (LastUpdated = new Date()) => {
	const today = new Date();
	const weeks = Math.floor((today - LastUpdated) / week);
	const updateDay = new Date(LastUpdated.getTime() + weeks*week);

	return {weeks, date: updateDay};
}

const runIncome = async (interaction) => {
    const {faction} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;

    const settings = await getFaction(server, "Settings");

    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        incomeLog({arguments: {faction}, error: 'Faction not found'})
        await interaction.reply('Faction not found');
        return;
    }

    const resources = factionData.Resources;
    const lastDate = factionData.date.toDate();

    const {weeks, date: newDate} = updateDate(lastDate);

    const income = objectMap(factionData.Income, inc => inc*weeks);

    const newResources = objectMap(resources, 
        (resource, name) => resource + income[name]
    );
    const newTimestamp = Timestamp.fromDate(newDate);
    setFaction(server, faction, {Resources: newResources, date: newTimestamp});
    await interaction.reply(
        `${faction} has claimed ${handleReturnMultiple(income, settings.Resources)} for ${weeks} week(s) of income`
    );
}

const command = new SlashCommandBuilder().setName('income').setDescription('Collect Income');
generateInputs(command, inputs);

const income = {
    data: command,
    execute: runIncome
}

module.exports = income;
