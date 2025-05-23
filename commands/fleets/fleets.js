const { componentCollector, generateRow } = require("../../functions/discord/actionHandler");
const commandBuilder = require("../../functions/discord/commandBuilder");
const { inputs: createInputs, createFleet } = require("../../functions/fleets/create");
const { list } = require("../../functions/fleets/list");
const { inputs: listInputs } = require("../../functions/fleets/list/normalList");
const { inputs: renameInputs, ...rename } = require("../../functions/fleets/list/rename");
const { inputs: actionInputs, ...action } = require("../../functions/fleets/list/action");

const name = "fleet";
const description = "For testing a new style of rating";

const inputs = [
    {
        name: "create",
        description: "Create a fleet",
        type: "Subcommand",
        options: createInputs,
    },
    {
        name: "list",
        description: "List fleets",
        type: "Subcommand",
        options: listInputs,
    },
    {
        name: "rename",
        description: "Rename a fleet",
        type: "Subcommand",
        options: renameInputs,
    },
    {
        name: "state",
        description: "Change fleet state",
        type: "Subcommand",
        options: actionInputs
    }
]

const command = {name, description, inputs};

const fleets = async (interaction, inputs) => {
    const server = interaction.guild.name;
    let resultStr;
    let components = [];
    let allComponents = [];

    switch (inputs.Subcommand) {
        case "create":
            resultStr = await createFleet(server, inputs);
            break;
        case "list":
            [resultStr, components, allComponents] = await list(server, inputs);
            break;
        case "rename":
            [resultStr, components, allComponents] = await list(server, inputs, rename);
            break;
        case "state":
            [resultStr, components, allComponents] = await list(server, inputs, action);
            break;
        default:
            resultStr = "Not accepted Input"
    }

    const result = await interaction.reply({
        content: resultStr,
        components: components.map((row) => generateRow(row))
    });

    if (components.length === 0) return;

    const basicFilter = (i) => i.user.id === interaction.user.id

    const shutdown = async (_, reason) => {
        if (reason === 'user') return;
        await interaction.editReply({content: `Process done`, components: []});
    }

    componentCollector(allComponents.flat(), 720_000, shutdown, basicFilter)(result);
}

module.exports = commandBuilder(command, fleets);