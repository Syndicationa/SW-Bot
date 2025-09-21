const commandBuilder = require("../../functions/discord/commandBuilder");
const { generateRow, componentCollector } = require('../../functions/discord/actionHandler');
const pageController = require("../../functions/pageButtons");
const { getFaction } = require("../../functions/database");
const { handleReturnMultiple } = require("../../functions/currency");

const name = "list-vehicles";
const description = "List a faction's vehicles";

const inputs = [
    {name: "faction", description: "Faction", type: "String", required: true}
]

const command = {name, description, inputs};

const print = (intro, page) => {
    return `\`\`\`${intro}\n${page.join("\n")}\`\`\``
}

const updatePage = (intro, pages) => (interaction, pageNumber, buttons) => {
    interaction.update({
        content: print(intro, pages[pageNumber]),
        components: [generateRow(buttons)]
    })
}

const vehicleLine = (vehicle, i, numLen) => {
    let name = vehicle.name;
    if (name.length > 20) name = name.slice(0,19) + "-";
    return `${`${i}`.padStart(numLen)} | ${name.padEnd(20)} | ${handleReturnMultiple(vehicle.cost, undefined, ", ")}`;
}

const makePages = (faction, vehicles) => {
    const numLen = Math.max(2, Math.floor(Math.log10(vehicles.length) + 1));

    const tableMessage = `ID`.padEnd(numLen) + ` | Name`.padEnd(23) + ` | Cost`;
    const tableLine = "-".repeat(tableMessage.length);
    const fleetStrs = vehicles.map((v, i) => vehicleLine(v, i, numLen));

    const pages = [[]];
    let charCount = 0;
    
    let page = pages[0];

    const intro = [faction + " ", tableMessage, tableLine].join("\n");
    charCount = intro.length;

    for (const str of fleetStrs) {
        charCount += str.length + 1; //Adds one for the new line

        if (charCount > 1994) {//2000 character limit - 6 for the block statement
            pages.push([]);
            page = pages[pages.length - 1];
            charCount = intro.length + str.length + 1;
        }

        page.push(str);
    }

    return [intro, pages];
}

const list = async (interaction, inputs) => {
    const { faction } = inputs;
    const server = interaction.guild.name;

    const factionData = await getFaction(server, faction);
    if (factionData === undefined) {
        error = 'Faction not found';
        listBLog({arguments, error});
        await interaction.reply(error);
        return;
    }

    const [intro, pages] = makePages(faction, factionData.Vehicles);

    const pageButtons = pageController(pages.length, updatePage(intro, pages));

    const result = await interaction.reply({
        content: print(intro, pages[0]),
        components: [generateRow(pageButtons)]
    })

    const basicFilter = (i) => i.user.id === interaction.user.id
    const shutdown = async (_, reason) => {
        await interaction.editReply("Done");
    }

    componentCollector(pageButtons, 720_000, shutdown, basicFilter)(result);
}

module.exports = commandBuilder(command, list);