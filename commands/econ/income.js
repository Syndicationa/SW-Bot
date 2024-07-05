const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { Timestamp } = require('firebase-admin/firestore');
const {getFaction, setFaction, getFactionNames} = require("../../functions/database");
const { db } = require('../../firebase');
const { log } = require('../../functions/log');
const {handleReturnMultiple } = require('../../functions/currency');
const {objectMap} = require('../../functions/functions');
const { calculateIncome, equResources } = require('../../functions/incomeMath');
const { getFactionStats } = require('../../functions/income');

const incomeLog = log('income');

const inputs = [
    {name: "faction", description: "Faction to collect Income", type: "String", required: true},
]

const week = (7 * 24 * 60 * 60 * 1000);



const runIncome = async (interaction) => {
    const {faction} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;
    const name = interaction.user.username;

    const settings = await getFaction(server, "Settings");

    if (faction === "RCalc" && (name === "fer.0" || name === "syndicationus")) {
        await interaction.deferReply();
        const factions = getFactionNames(server);
        const outcomes = factions.map(async (factionName) => {
            if (factionName === "settings") return "";
            const faction = await getFaction(server, factionName);
            if (faction.Maps === undefined) return;
            
            const {Capacities, Storage} = getFactionStats(settings, faction);
            
            console.log(factionName);

            if (equResources(Capacities, faction.Capacities) && equResources(Storage, faction.Storage))
                return "";

            setFaction(server, factionName, {Capacities, Storage});
            return factionName;
        });

        let outcome = (await Promise.all(outcomes)).join("\n");
        if (outcome.match(/./g) === null) outcome = "No Factions Modified"
        await interaction.editReply(outcome);
        return;
    }

    const factionData = await getFaction(server, faction.toLowerCase());
    if (factionData === undefined) {
        incomeLog({arguments: {faction}, error: 'Faction not found'})
        await interaction.reply('Faction not found');
        return;
    }

    const income = calculateIncome(factionData);
    console.log(income);
    const lastDate = factionData.date.toDate();

    const nextDate = new Date(lastDate.getTime() + week);
    await interaction.reply(
        `${faction} claimed income on ${lastDate.getUTCFullYear()}/${lastDate.getUTCMonth()+1}/${lastDate.getUTCDate()}, 
        will claim on ${nextDate.getUTCFullYear()}/${nextDate.getUTCMonth()+1}/${nextDate.getUTCDate()}, 
        and will claim ${handleReturnMultiple(income, undefined, ", ")}`
    );
}

const command = new SlashCommandBuilder().setName('income').setDescription('Get Information about your Income');
generateInputs(command, inputs);

const income = {
    data: command,
    execute: runIncome
}

module.exports = income;
