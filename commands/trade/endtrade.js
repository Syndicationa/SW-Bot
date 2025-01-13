const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { addResources } = require('../../functions/resourceMath');
const { calculateIncome } = require('../../functions/incomeMath');
const { findTrade } = require('../../functions/trades');

const endTradeLog = log('endtrade')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "id", description: "ID of trade", type: "Number", required: true},
]

const runEndTrade = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction: f, id: ID} = arguments;
    const faction = f.toLowerCase();
    const server = interaction.guild.name;
    let error = "";

    const data = await getFaction(server, "Data");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        endTradeLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const tradeList = [...data.Trades.Active, ...data.Trades.Pending];

    const Pending = data.Trades.Pending.filter(trade => trade.ID !== ID);
    const Active = data.Trades.Active.filter(trade => trade.ID !== ID);

    const trade = findTrade(tradeList, ID);
    
    if (trade === undefined) {
        error = 'Trade not found';
        endTradeLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (trade[faction] === undefined) {
        error = `${f} not in trade`;
        endTradeLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const otherName = Object.keys(trade).filter(str => str !== "ID" && str !== faction)[0];
    const other = await getFaction(server, otherName);

    if (other === undefined) {
        error = `${otherName} not found`;
        endTradeLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    setFaction(server, faction, {
        Trades: factionData.Trades.filter(trade => trade !== ID),
        Outgoing: factionData.Outgoing.filter(request => request.Data !== ID),
        Incoming: factionData.Incoming.filter(request => request.Data !== ID)
    });
        
    setFaction(server, otherName, {
        Trades: other.Trades.filter(trade => trade !== ID),
        Outgoing: other.Outgoing.filter(request => request.Data !== ID),
        Incoming: other.Incoming.filter(request => request.Data !== ID)
    })
        
    setFaction(server, "data", {Trades: {Pending, Active}});

    const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${f} ended the trade with ${otherName}`
    );
    await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('end-trade').setDescription('Remove a member from the trade');
generateInputs(command, inputs);

const endTrade = {
    data: command,
    execute: runEndTrade
}

module.exports = endTrade;