const exampleInputs = [
    {
        name: "Type",
        description: "Does something",
        type: "String",
        required: false,
        choices: [
            {name: "A", value: "A"}
        ],
        default: ""
    }
];

const typeFunction = type => {
    switch (type) {
        case "String":
            return (c,f) => c.addStringOption(f)
        case "Integer":
            return (c,f) => c.addIntegerOption(f) 
        case "Number":
            return (c,f) => c.addNumberOption(f) 
        case "Boolean":
            return (c,f) => c.addBooleanOption(f) 
        case "User":
            return (c,f) => c.addUserOption(f) 
        case "Channel":
            return (c,f) => c.addChannelOption(f) 
        case "Role":
            return (c,f) => c.addRoleOption(f) 
        case "Mentionable":
            return (c,f) => c.addMentionableOption(f) 
        case "Attachment":
            return (c,f) => c.addAttachmentOption(f)
        case "Subcommand":
            return (c,f) => c.addSubcommand(f)
    }
}

const optionFunction = (data = exampleInputs[0]) => option => {
    if (data.name) option.setName(data.name);
    if (data.description) option.setDescription(data.description);
    if (data.required) option.setRequired(data.required);

    if (Array.isArray(data.options)) generateInputs(option, data.options);
    if (Array.isArray(data.choices)) option.addChoices(...data.choices);
    
    return option;
};

const generateInputs = (command, inputArray = exampleInputs) => {
    inputArray.forEach((input) => {
        typeFunction(input.type)(command, optionFunction(input))
    })
}

const retrieveFunction = (input = exampleInputs[0]) => {
    //Subcommands are handled separately
    switch (input.type) {
        case "String":
            return (option) => option.getString(input.name) ?? input.default
        case "Integer":
            return (option) => option.getInteger(input.name) ?? input.default
        case "Number":
            return (option) => option.getNumber(input.name) ?? input.default
        case "Boolean":
            return (option) => option.getBoolean(input.name) ?? input.default
        case "User":
            return (option) => option.getUser(input.name) ?? input.default
        case "Channel":
            return (option) => option.getChannel(input.name) ?? input.default
        case "Role":
            return (option) => option.getRole(input.name) ?? input.default
        case "Mentionable":
            return (option) => option.getMentionable(input.name) ?? input.default
        case "Attachment":
            return (option) => option.getAttachment(input.name) ?? input.default
    }
}

const retrieveInputs = (options, inputArray = exampleInputs) => {
    let output = {};
    inputArray.forEach((input) => {
        if (input.type === "Subcommand") {
            if (options.getSubcommand() !== input.name) return;

            output = {...output, ...retrieveInputs(options, input.options)};
            
            if (output.Subcommand) output.Subcommand = `${input.name}/${output.Subcommand}`;
            else output.Subcommand = input.name;
            
            return;
        }

        const data = retrieveFunction(input)(options);
        if (data !== null) 
            if (input.type === "Subcommand") output = {...output, ...data, Subcommand: input.name};
            else output[input.name] = data;
    })
    return output;
}

module.exports = {
    generateInputs,
    retrieveInputs
};