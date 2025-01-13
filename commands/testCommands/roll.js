const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { db } = require('../../firebase');
const { getFaction } = require('../../functions/database');
const { handleReturnMultiple } = require('../../functions/currency');
const { log } = require('../../functions/log');

const inputs = [
    {name: "type", description: "eg.2d6, 2h6, or 12l4", type: "String", required: true},
]

const command = new SlashCommandBuilder().setName('roll').setDescription('Roll Dice');
generateInputs(command, inputs);

const rollLog = log('roll');

const rollDice = async (interaction) => {
    const {type} = retrieveInputs(interaction.options, inputs);
    if (typeof type !== "string" || type.match(/(\d+)?[dhl]\d+/g) === null) {
        let error = `${type} is not a dice string`;
        rollLog(type, error)
        await interaction.reply(error);
        return;
    }

    const roll = type.match(/(\d+)?[dhl]\d+/g)[0]
    const [count, sideCount] = roll.replace(/[dhl]/g, "s").split("s").map(s => s === "" ? 1:Number(s));
    const option = roll.replace(/\d+/g, "");
    const optionFunc = option === "d"
                        ? (a, b) => a + b
                        : option === "h"
                            ? Math.max
                            : Math.min

    const rolls = Array(count).fill(0).map(() => Math.floor(Math.random()*sideCount) + 1);
    const outcome = rolls.reduce((a, v) => optionFunc(a, v));

    await interaction.reply(`${roll} => rolled ${outcome} from ${rolls.join(", ")}`);
}

const roll = {
    data: command,
    execute: rollDice
}

module.exports = roll;
