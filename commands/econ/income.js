const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { Timestamp } = require('firebase-admin/firestore');
const {getFaction, setFaction, getFactionNames} = require("../../functions/database");
const { db } = require('../../firebase');
const { log } = require('../../functions/log');
const {handleReturnMultiple } = require('../../functions/currency');
const {objectMap} = require('../../functions/functions');
const { calculateIncome } = require('../../functions/incomeMath');
const { equResources } = require('../../functions/resourceMath');
const { getFactionStats } = require('../../functions/income');

const incomeLog = log('income');

const inputs = [
    {name: "faction", description: "Faction to collect Income", type: "String", required: true},
    {name: "trade", description: "Include Trades", type: "Boolean", required: false, default: true}
]

const incomePeriod = (5 * 24 * 60 * 60 * 1000);


const runIncome = async (interaction) => {
    const {faction, trade} = retrieveInputs(interaction.options, inputs);
    const server = interaction.guild.name;
    const name = interaction.user.username;

    const settings = await getFaction(server, "Settings");
    const data = await getFaction(server, "Data");

    if (faction === "RCalc" && (name === "fer.0" || name === "syndicationus")) {
        await interaction.deferReply();
        const factions = getFactionNames(server);
        const outcomes = factions.map(async (factionName) => {
            if (factionName === "settings" || factionName === "data") return "";
            const faction = await getFaction(server, factionName);
            if (faction.Maps === undefined) return;
            
            const {Capacities, Storage} = getFactionStats(settings, faction);
            
            console.log(factionName);

            if (equResources(Capacities, faction.Capacities) && equResources(Storage, faction.Storage))
                return "";

            setFaction(server, factionName, {Capacities, Storage});
            return factionName;
        });

        let outcome = (await Promise.all(outcomes)).filter(str => str.length > 0 ).join("\n");
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

    const trades = data.Trades.Active;

    const income = calculateIncome(factionData, trades, faction, trade);
    console.log(income);

    const lastDate = data.date.toDate();
    const nextDate = new Date(lastDate.getTime() + incomePeriod);

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
