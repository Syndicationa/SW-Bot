const exampleTrade = {
    ID: 0,
    ['A']: {
        Resources: {},
        Debt: {},
        Priority: 2
    },
    ['B']: {
        Resources: {},
        Debt: {},
        Priority: 1
    }
};

const makeTrade = (ID, [partA, partB], [tradeA, tradeB], priority) => {
    return {
        ID,
        [partA]: {
            Resources: tradeA,
            Debt: {},
            Priority: priority,
        },
        [partB]: {
            Resources: tradeB,
            Debt: {},
            Priority: NaN,
        }
    }
}

const joinATrade = (trade, member, priority) => {
    if (trade[member] === undefined) return false;
    if (!isNaN(trade[member].Priority)) return false;
    return {
        ...trade,
        [member]: {
            ...trade[member],
            Priority: priority
        }
    };
}

const generateNextTradeID = (tradeList) => {
    const sorted = tradeList.sort((a, b) => a.ID - b.ID);
    
    for (let i = 0; i < sorted.length; i++)
        if (i < sorted[i].ID) return i;
    return sorted.length;
}

const findTrade = (list = [exampleTrade], ID) => list.find(trade => trade.ID === ID);

module.exports = {generateNextTradeID, makeTrade, findTrade, joinATrade}