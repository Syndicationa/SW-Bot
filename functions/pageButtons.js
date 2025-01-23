const { generateRow } = require("./discord/actionHandler");

const buttons = (left, right, pageCount) => (pageNumber) => [
    {
        action: "button",
        label: "<",
        id: "left",
        style: "Secondary",
        disabled: false,

        function: left
    },
    {
        action: "button",
        label: `${pageNumber + 1}/${pageCount}`,
        id: "n/a",
        style: "Secondary",
        disabled: true,
    },
    {
        action: "button",
        label: ">",
        id: "right",
        style: "Secondary",
        disabled: false,

        function: right
    },
];

const exampleUpdatePage = (interaction, pageNumber, buttons) => {
    interaction.update({
        content: `Page is now ${pageNumber}`,
        components: [generateRow(buttons)]
    })
}

const controller = (pageCount, updatePage = exampleUpdatePage, startingPage = 0) => {
    let pageNumber = startingPage;

    let buttonsWithoutNumber;

    const changePage = dir => async (i) => {
        pageNumber += dir + pageCount;
        pageNumber %= pageCount;

        updatePage(i, pageNumber, buttonsWithoutNumber(pageNumber));
    };

    buttonsWithoutNumber = buttons(changePage(-1), changePage(1), pageCount);

    const startingButtons = buttonsWithoutNumber(pageNumber);
    return startingButtons;
}

module.exports = controller;