const { ActionRowBuilder, 
    ButtonStyle, ButtonBuilder, 
    StringSelectMenuBuilder, UserSelectMenuBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, MentionableSelectMenuBuilder, 
    StringSelectMenuOptionBuilder } = require("discord.js");

const exampleButtons = [
    {
        action: "button",
        label: "Press Me",
        id: "press",
        style: "Primary",
        emoji: false,
        disabled: false,

        function: () => {}
    },
    {
        action: "button",
        label: "I is a link",
        url: "https://www.google.com",
        style: "Link"
    }
];

const createButton = (buttonData) => {
    const button = new ButtonBuilder();
    button.setLabel(buttonData.label);
    button.setStyle(ButtonStyle[buttonData.style]);
    
    if (buttonData.style === "Link") {
        button.setURL(buttonData.url);
    } else {
        button.setCustomId(buttonData.id);
    }

    if (buttonData.disabled) button.setDisabled(true);
    if (buttonData.emoji) button.setEmoji(true);

    return button;
}

const exampleSelectMenu = {
    action: "menu",
    placeholder: "Prompt",
    id: "Select Menu",
    type: "string",
    values: [
        {label: "String", description: "This says String", value: "STR", emoji: false, default: false}
    ],
    minCount: 1,
    maxCount: 1,

    function: () => {}
};

const buildStringOptions = (values = exampleSelectMenu.values) =>
    values.map((optionData) => {
        const option = new StringSelectMenuOptionBuilder();
        option.setLabel(optionData.label);
        option.setValue(optionData.value);
        if ("description" in optionData) option.setDescription(optionData.description);
        if ("emoji" in optionData) option.setEmoji(optionData.emoji);
        if ("default" in optionData) option.setDefault(optionData.default);
        return option;
    });

const generateSelectMenu = (menuData = exampleSelectMenu) => {
    let menu;
    switch (menuData.type.toLowerCase()) {
        case "string": 
            menu = new StringSelectMenuBuilder();
            menu.addOptions(...buildStringOptions(menuData.values));
            break;
        case "user": 
            menu = new UserSelectMenuBuilder();
            break;
        case "role": 
            menu = new RoleSelectMenuBuilder();
            break;
        case "channel": 
            menu = new ChannelSelectMenuBuilder();
            break;
        case "mentionable": 
            menu = new MentionableSelectMenuBuilder();
            break;
    }

    menu.setCustomId(menuData.id);
    if ("placeholder" in menuData) menu.setPlaceholder(menuData.placeholder);
    if ("minCount" in menuData) menu.setMinValues(menuData.minCount);
    if ("maxCount" in menuData) menu.setMinValues(menuData.maxCount);

    return menu;
}

const generateRow = (rowComponents) => {
    const row = new ActionRowBuilder();
    const components = rowComponents.map((componentData) => {
        switch (componentData.action.toLowerCase()) {
            case "button": return createButton(componentData);
            case "menu": return generateSelectMenu(componentData);
            default: return {};
        }
    })

    row.addComponents(...components);

    return row;
}

const componentSingleUse = (components, time, shutdown = () => {}, filter = () => true) => async response => {
    const componentMap = new Map();

    components.forEach(component => {
        if (!("id" in component)) return;
        componentMap.set(component.id, component.function);
    });

    const collector = response.createMessageComponentCollector({filter, time})

    collector.once("collect", async i => {
        componentMap.get(i.customId)(i, collector)
        collector.stop("Recieved input");
    });

    collector.once("end", (collection, reason) => {
        if (reason === 'time') shutdown();
    });
}

const componentCollector = (components, time, shutdown = () => {}, filter = () => true) => response => {
    const componentMap = new Map();

    components.forEach(component => {
        if (!("id" in component)) return;
        componentMap.set(component.id, component.function);
    });

    const collector = response.createMessageComponentCollector({filter, time})

    collector.on("collect", async i => {
        console.log(Object.keys(i));
        componentMap.get(i.customId)(i, collector)
    });

    collector.once("end", (collection, reason) => {
        if (reason === 'time') shutdown(collection, reason)
    });
}

module.exports = { generateRow, componentSingleUse, componentCollector };