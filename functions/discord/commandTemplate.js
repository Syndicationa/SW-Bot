const commandBuilder = require("../../functions/discord/commandBuilder");

const name = "name";
const description = "";

const inputs = [
    
]

const command = {name, description, inputs};

const func = async (interaction, inputs) => {
    
}

module.exports = commandBuilder(command, func);