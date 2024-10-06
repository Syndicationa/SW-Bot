const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { addResources } = require('../../functions/resourceMath');
const { calculateIncome } = require('../../functions/incomeMath');
const { findTrade, joinATrade } = require('../../functions/trades');

const acceptTradeLog = log('accepttrade')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "id", description: "ID of trade", type: "Number", required: true},
    {name: "priority", description: "Trade Priority", type: "Integer", required: true}
]

const runAcceptTrade = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction: f, id: ID, priority} = arguments;
    const faction = f.toLowerCase();
    const server = interaction.guild.name;
    let error = "";

    const data = await getFaction(server, "Data");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        acceptTradeLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const tradeList = data.Trades.Pending;

    const Pending = data.Trades.Pending.filter(trade => trade.ID !== ID);
    const Active = data.Trades.Active.filter(trade => trade.ID !== ID);

    const trade = findTrade(tradeList, ID);

    if (trade === undefined) {
        error = 'Trade not found';
        acceptTradeLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const newTrade = joinATrade(trade, faction, priority);

    if (newTrade) {
        setFaction(server, faction, {
            Trades: [...factionData.Trades, newTrade.ID], 
            Incoming: factionData.Incoming.filter(request => request.Data !== ID)});
        setFaction(server, "data", {Trades: {Pending, Active: [...Active, newTrade]}});

        const name = Object.keys(trade).filter(str => str !== "ID" && str !== faction)[0];
        const founder = await getFaction(server, name);
        setFaction(server, name, 
            {Trades: [...founder.Trades, ID], Outgoing: founder.Outgoing.filter(request => request.Data !== ID)})
        
        const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
            `${faction} has accepted the trade`
        );
        await interaction.reply({ embeds: [ embed ]});
    } else {
        const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
            `${faction} cannot join this trade`
        );
        await interaction.reply({ embeds: [ embed ]});
    }
}

const command = new SlashCommandBuilder().setName('accept-trade').setDescription('Accept a Trade Request');
generateInputs(command, inputs);

const accepttrade = {
    data: command,
    execute: runAcceptTrade
}

module.exports = accepttrade;