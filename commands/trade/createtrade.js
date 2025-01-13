const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple, convertToObject } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { addResources } = require('../../functions/resourceMath');
const { calculateIncome } = require('../../functions/incomeMath');
const { generateNextTradeID, makeTrade } = require('../../functions/trades');

const createtradeLog = log('createtrade')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "other", description: "Specify the other Faction", type: "String", required: true},
    {name: "send", description: "The resources you will send", type: "String", required: true},
    {name: "receive", description: "The resources you will recieve", type: "String", required: true},
    {name: "priority", description: "Trade Priority", type: "Integer", required: true}
]

const invalidResources = (costs, settings) => {
    const NaNCosts = costs.some((cost) => isNaN(cost[0]));
    const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0);

    return NaNCosts || !isValidType || costs === undefined
}

const runCreateTrade = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, other, send, receive, priority} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const data = await getFaction(server, "Data");
    const settings = await getFaction(server, "Settings");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        createtradeLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const targetData = await getFaction(server, other);
    if (targetData === undefined) {
        error = 'Other faction not found';
        createtradeLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    
    const sentResources = splitCurrency(send);
    const receiveResources = splitCurrency(receive);

    
    if (invalidResources(sentResources, settings) || invalidResources(receiveResources, settings)) {
        error = 'Error in amount';
        transferLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const resources = [convertToObject(settings.Resources, sentResources), convertToObject(settings.Resources, receiveResources)]
       
    const tradeList = [...data.Trades.Active, ...data.Trades.Pending];
    const nextID = generateNextTradeID(tradeList);
    const trade = makeTrade(nextID, [faction.toLowerCase(), other.toLowerCase()], resources, priority)

    console.log(trade)

    setFaction(server, faction, {Outgoing: [...factionData.Outgoing, {Type: `Trade`, Data: trade.ID}]});
    setFaction(server, other, {Incoming: [...factionData.Incoming, {Type: `Trade`, Data: trade.ID}]});
    setFaction(server, "data", {Trades: {...data.Trades, Pending: [...data.Trades.Pending, trade]}});
    
    const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${faction} has sent a request to trade to ${other}`
    );
    await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('create-trade').setDescription('Create a Trade');
generateInputs(command, inputs);

const createtrade = {
    data: command,
    execute: runCreateTrade
}

module.exports = createtrade;