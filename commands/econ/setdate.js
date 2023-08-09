const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { Timestamp } = require('firebase-admin/firestore');
const {getFaction, setFaction} = require("../../functions/database");
const { db } = require('../../firebase');
const { log } = require('../../functions/log');

const setdateLog = log('setdate');

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "year", description: "Date's year", type: "Integer", required: true},
    {name: "month", description: "Date's month", type: "Integer", required: true},
    {name: "day", description: "Date's day", type: "Integer", required: true}
]

const runSetDate = async (interaction) => {
    const {faction, year, month, day} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;

    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        setdateLog({arguments: {faction}, error: 'Faction not found'})
        await interaction.reply('Faction not found');
        return;
    }
    
    const lastDate = Date.UTC(year, month - 1, day);
    const newDate = new Date(lastDate);
    const newTimestamp = Timestamp.fromDate(newDate);
    setFaction(server, faction, {date: newTimestamp});
    await interaction.reply(`${faction} has set the previous income date to ${year}/${month}/${day}`);
}

const command = new SlashCommandBuilder().setName('setdate').setDescription('Collect SetDate');
generateInputs(command, inputs);

const setdate = {
    data: command,
    execute: runSetDate
}

module.exports = setdate;