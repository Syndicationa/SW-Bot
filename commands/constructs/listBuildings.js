const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const {getFaction,} = require("../../functions/database");
const { log } = require('../../functions/log');
const { countBuildings, addResources } = require('../../functions/resourceMath');
const { objectMap, objectReduce } = require('../../functions/functions');

const listBLog = log('registerBuidling');

const prettify = number => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true},
    {name: "location", description: "Place to read buildings", type: "String", required: false}
]

const runListConstructs = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction, location} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const factionData = await getFaction(server, faction);
    const settings = await getFaction(server, "settings")
    const place = location === undefined 
        ? objectReduce(factionData.Maps,
            (acc, data) => {
                const Buildings = acc.Buildings.map((counts, i) => addResources(counts, data.Buildings[i] ?? {}))
                const Hexes = data.Hexes + acc.Hexes
                return {Buildings, Hexes};
            }, {Buildings: factionData.Buildings.map(() => {return {}}), Hexes: 0, TotalHexes: 0}
        )
        : {...factionData?.Maps[location]};
    
    place.TotalHexes = location === undefined 
        ? objectReduce(settings.Places, (acc, place) => acc + place.Size, 0)
        : settings.Places[location].Size;

    const buildings = factionData.Buildings;
    if (factionData === undefined) {
        error = 'Faction not found';
        listBLog({arguments, error});
        await interaction.reply(error);
        return;
    } else if (place === undefined) {
        error = 'Location not found';
        listBLog({arguments, error});
        await interaction.reply(error);
    }
    
    const buildingStr = 
        place.Buildings.map(
            (building,i) => 
                building === null || countBuildings(building) === 0 ? undefined :
                `${buildings[i].name} (ID: ${i}): ${countBuildings(building)}`
                + objectReduce(building, (str, count, lvl) => 
                    str + (count === 0 ? '':`\n  Lvl ${("" + (Number(lvl) + 1)).padStart(2, " ")}: ${count}`),
                "")
        ).filter((a) => a !== undefined).join("\n ");

    await interaction.reply(
    `${faction}\n${location ?? 'All'}\n${prettify(place.Hexes)}/${prettify(place.TotalHexes)} Hexagons\nBuildings: \`\`\` ${buildingStr}\`\`\`\n-# list-buildings`);
}

const command = new SlashCommandBuilder().setName('list-buildings').setDescription('List a faction\'s buildings in a place');
generateInputs(command, inputs);

const listConstructs = {
    data: command,
    execute: runListConstructs
}

module.exports = listConstructs;