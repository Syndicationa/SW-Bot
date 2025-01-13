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
    }
}

const optionFunction = (data = exampleInputs[0]) => option => {
    option.setName(data.name).setDescription(data.description).setRequired(data.required)
    if (Array.isArray(data.choices)) option.addChoices(...data.choices)
    return option;
};

const generateInputs = (command, inputArray = exampleInputs) => {
    inputArray.forEach((input) => {
        typeFunction(input.type)(command, optionFunction(input))
    })
}

const retrieveFunction = (input = exampleInputs) => {
    switch (input.type) {
        case "String":
            return (option, name) => option.getString(name) ?? input.default
        case "Integer":
            return (option, name) => option.getInteger(name) ?? input.default
        case "Number":
            return (option, name) => option.getNumber(name) ?? input.default
        case "Boolean":
            return (option, name) => option.getBoolean(name) ?? input.default
        case "User":
            return (option, name) => option.getUser(name) ?? input.default
        case "Channel":
            return (option, name) => option.getChannel(name) ?? input.default
        case "Role":
            return (option, name) => option.getRole(name) ?? input.default
        case "Mentionable":
            return (option, name) => option.getMentionable(name) ?? input.default
        case "Attachment":
            return (option, name) => option.getAttachment(name) ?? input.default
    }
}

const retrieveInputs = (options, inputArray = exampleInputs) => {
    let output = {};
    inputArray.forEach((input) => {
        const data = retrieveFunction(input)(options, input.name);
        if (data !== null) output = {...output, [input.name]: data};
    })
    return output;
}

module.exports = {
    generateInputs,
    retrieveInputs
};