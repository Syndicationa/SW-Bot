const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const {getFaction,} = require("../../functions/database");
const { log } = require('../../functions/log');
const { objectMap, objectReduce } = require('../../functions/functions');
const { findTrade } = require('../../functions/trades');
const { handleReturnMultiple } = require('../../functions/currency');

const listBLog = log('trades');

const IDToString = (IDList, data, faction) => {
    const trades = [...data.Trades.Active, ...data.Trades.Pending].sort((a, b) => b[faction]?.Priority - a[faction]?.Priority).reverse();
    return IDList.map(id => stringify(findTrade(trades, id), faction))
}

const other = (trade, faction) => Object.keys(trade).filter(str => str !== "ID" && str !== faction)[0];
const stringify = (trade, faction) => 
    `ID: ${trade.ID} Partner: ${other(trade, faction)} `
    + `Sending: ${handleReturnMultiple(trade[faction].Resources, undefined, ", ")} `
    + `Requesting: ${handleReturnMultiple(trade[other(trade, faction)].Resources, undefined, ", ")} ` 
    + `Priority: ${isNaN(trade[faction].Priority) ? "N/A": trade[faction].Priority}`
    
const block = array => array.length === 0 ? 'None':`\`\`\`${array.join('\n')}\`\`\``

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true}
]

const runListTrades = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const factionData = await getFaction(server, faction);
    const data = await getFaction(server, "data");
    
    if (factionData === undefined) {
        error = 'Faction not found';
        listBLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const trades = IDToString(factionData.Trades, data, faction.toLowerCase());
    const outgoing = IDToString(factionData.Outgoing.filter((request) => request.Type === "Trade").map(r => r.Data), data, faction.toLowerCase());
    const incoming = IDToString(factionData.Incoming.filter((request) => request.Type === "Trade").map(r => r.Data), data, faction.toLowerCase());

    await interaction.reply(
    `${faction}
    Active: ${block(trades, faction)}
    Outgoing Requests: ${block(outgoing, faction)}
    Incoming Requests: ${block(incoming, faction)}\n-# trades`);
}

const command = new SlashCommandBuilder().setName('trades').setDescription('List a faction\'s trades');
generateInputs(command, inputs);

const listTrades = {
    data: command,
    execute: runListTrades
}

module.exports = listTrades;