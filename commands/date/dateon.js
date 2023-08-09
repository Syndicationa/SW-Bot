const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { prettyDate } = require('../../functions/dateWork');

const inputs = [
    {name: "year", description: "Date's year", type: "Integer", required: false},
    {name: "month", description: "Date's month", type: "Integer", required: false},
    {name: "day", description: "Date's day", type: "Integer", required: false},
    {name: "hour", description: "Date's hour", type: "Integer", required: false}
]

const runDateOn = async (interaction) => {
    const inputData = retrieveInputs(interaction.options, inputs);
    const now = new Date();
    const year = inputData.year ?? now.getFullYear();
    const month = (inputData.month ?? now.getMonth() + 1) - 1;
    const day = inputData.day ?? now.getDate();
    const firstHour = inputData.hour ?? 0;
    const finalHour = inputData.hour ?? 23;

    const firstDay = prettyDate(new Date(year, month, day, firstHour));
    const finalDay = prettyDate(new Date(year, month, day, finalHour, 59, 59, 999));    
    
    const hourText = `${firstHour}:00-${finalHour}:59`;
    const dayText = firstDay === finalDay ? firstDay: `a span from ${firstDay} to ${finalDay}`
    await interaction.reply(`The time on ${year}/${month + 1}/${day} ${hourText} is ${dayText}`);
}

const command = new SlashCommandBuilder().setName('dateon').setDescription('Calculate date for time');
generateInputs(command, inputs);

const dateon = {
    data: command,
    execute: runDateOn
}

module.exports = dateon;