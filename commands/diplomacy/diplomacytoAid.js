const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency, handleReturnMultiple } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const { objectMap, objectReduce } = require('../../functions/functions');

const diplomacyLog = log('diplomacy')

const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
    {name: "target", description: "Specify diplomacying or dimissing troops", type: "String", required: true},
    {name: "process", description: "Type of treaty / act", type: "String", required: true,
     choices: [{name: "Aid", value: "AID"}, {name: "MDP", value: "MDP"}, {name: "NAP", value: "NAP"}, {name: "join war", value: "JW"}]},
    {name: "quantity", description: "If the process is Aid, fill this value with the amount of aid after the declaration of aid", type: "String", required: false},
    {name: "end", description: "To end the process (doesn't apply for aid amounts)", type: "Boolean", required: false},
]

const runAid = () => {
    const aidAmount = splitCurrency(quantity);
    const influnceCost = aidAmount.reduce((acc, [amount, name]) => {
        if (name === "ER") return acc + amount / 1000000000;
        return acc + amount / 1000
    }, 0)
    const response = `sent ${amount} of aid to ${target}`;
    return [response, influnceCost];	
}

const rundiplomacy = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, target, process, quantity} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        diplomacyLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    
    const targetData = await getFaction(server, target);
    if (targetData === undefined) {
        error = 'Target not found';
        diplomacyLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    
    
    const Fresources = factionData.Resources;
    const FInfluence = Fresources[`Influence`];
    
    const Tresources = targetData.Resources;
    const TInfluence = Fresources[`Influence`];
    
    const FIncome = factionData.Income;
    const FInfluenceInc = FIncome[`Influence`];
    
    const TIncome = factionData.Income;
    const TInfluenceInc = TIncome[`Influence`];
    
    const TMaps = targetData.Maps;
    const FMaps = factionData.Maps;
    
    const hexCount = objectReduce(TMaps, (count, map) => count + map.Hexes, 0) + objectReduce(FMaps, (count, map) => count + map.Hexes, 0)
    
    const newFResources = {};
    const newTResources = {};
    
    const newFIncome = {};
    const newTIncome = {};
    
    let response = "";
    let nVal = 0;
    
    if (process === "AID") {	
        
    } else if (process === "MDP") {
        nVal = 50;
        if(!end){
            response = `made an MDP with ${target}`;
            newFIncome['Influence'] = FInfluenceInc - nVal;	
            newTIncome['Influence'] = TInfluenceInc - nVal;
        } else {
            response = `ended an MDP with ${target}`;
            newFIncome['Influence'] = FInfluenceInc + nVal;	
            newTIncome['Influence'] = TInfluenceInc + nVal;
        }
        
    } else if (process === "NAP") {
        
        nVal = 20;
        if(!end){
            response = `made an NAP with ${target}`;
            newFIncome['Influence'] = FInfluenceInc - nVal;	
            newTIncome['Influence'] = TInfluenceInc - nVal;
        } else {
            response = `ended an NAP with ${target}`;
            newFIncome['Influence'] = FInfluenceInc + nVal;	
            newTIncome['Influence'] = TInfluenceInc + nVal;
        }
        
    } else if (process === "JW") {
        
        nVal = 75;
        response = `joined a war against ${target}`;
        newFResources['Influence'] = FInfluence - nVal;	
        if(!end){
            response = `joined a war against ${target}`;
            newFIncome['Influence'] = FInfluenceInc - nVal;	
        } else {
            response = `ended a war against ${target}`;
            newFIncome['Influence'] = FInfluenceInc + nVal;	
        }
        
    }
    
    if (newFResources[`Influence`] < 0) {
        error = 'Not enough Influence';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    if (newTResources[`Influence`] < 0) {
        error = 'Not enough Influence';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    if (newFIncome[`Influence`] < 0) {
        error = 'Error in amount: negative influence income';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }
    if (newTIncome[`Influence`] < 0) {
        error = 'Error in amount: negative influence income';
        claimLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    setFaction(server, faction, {Resources: {...Fresources, ...newFResources}});
    setFaction(server, faction, {Income: {...FIncome, ...newFIncome}});
    setFaction(server, target, {Income: {...TIncome, ...newFIncome}});
    const embed = new EmbedBuilder().setTitle(`Diplomatic Act`).setColor(0x0099FF).setDescription(
        `${faction} ${response} for ${nVal} Influence`);
        
    await interaction.reply({ embeds: [ embed ]});
}

const command = new SlashCommandBuilder().setName('aid').setDescription('Make aid');
generateInputs(command, inputs);

const diplomacy = {
    data: command,
    execute: rundiplomacy
}

// module.exports = diplomacy;
