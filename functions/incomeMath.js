const { defaultResources } = require('./currency');
const { objectReduce, objectMap, split, objectFilter } = require('./functions');
const { subResources, validResources, minResources, addResources, mulResources, roundResources, economicCountBuildings, scaleResources, equResources, isEmpty, countBuildings, maxResources } = require('./resourceMath');

const calculateCapacitiesOnWorld = (settingsPlanet, planet, buildings, blankStorage, blankCapacities) =>
    planet.Buildings.reduce(
        (acc, building, index) => {
            if (building === null) return acc;
            const count = economicCountBuildings(building);

            const capacities = roundResources(addResources(mulResources(scaleResources(buildings[index].capacity, count), scaleResources(settingsPlanet.Resources, 1/100)), acc.capacities));
            const storage = roundResources(addResources(scaleResources(buildings[index].storage, count),acc.storage));
        
            // console.log(building, buildings[index].capacity, capacities);
            return {storage, capacities};
        }
        , {storage: blankStorage, capacities: blankCapacities}
    )

const calculateCapacities = (faction, settingMaps, blankStorage, blankCapacities) => {
    const {storage, capacities} = objectReduce(faction.Maps,
        (acc, map, name) => {
            const {storage, capacities} = calculateCapacitiesOnWorld(settingMaps[name], map, faction.Buildings, blankStorage, blankCapacities);
            return {
                storage: addResources(storage, acc.storage),
                capacities: addResources(capacities, acc.capacities)
            }
        },
        {storage: blankStorage, capacities: blankCapacities}
    )
    return {...faction, Storage: storage, Capacities: capacities};
}

const calculateInfluence = (res, usages, maps) => { 
    const hexCount = objectReduce(maps, (count, map) => count + map.Hexes, 0)
    const influenceIncome = usages.Influence; // Influence Income changes from pacts and human events.
    const influence = Math.max(2500 - 0.25*hexCount, 50) - influenceIncome;
	return Math.min(influence, 10000 - res.Influence)
}

const calculatePopulation = (res) => {
    const consumableInfluence = res.CS * 50000/ res.Population;
    const populationGrowth = 
       consumableInfluence <= 0.5 ? -5
       : consumableInfluence <= 1 ? (consumableInfluence - 1)*1
       : consumableInfluence <= 2 ? (consumableInfluence - 1)*5
       : 5;
    const population = res.Population*populationGrowth*2/100;
    return population;
}

const calculateERIncome = (Resources) => {
    const treasury = Resources.ER
    const workingPopulation = Resources.Population - Resources.Military
    const percentage = 
        treasury <= 1000000000000 ? 100
        : treasury <= 15000000000000 ? (-0.005714*(treasury/1000000000 - 1000)+100)
        : (22 - Math.log10((treasury/1000000000 - 5699))/2)
    const income = percentage/100 * (
        workingPopulation <= 250000000 ? 245 * workingPopulation/210 *1000 - 41666666666
        : 1000000000*((1.7 * Math.log10(workingPopulation + 1))**2 + 46.18193)
    )

    // console.log(treasury, workingPopulation, percentage, income)
    return Math.max(Math.round(income),5000000000);
}

const calculateUnrefinedIncome = (faction) => {
    const {Resources, Capacities, Usages} = faction;

    const [unrefined, refined, unique] = split(Object.keys(Resources));

    const income = objectMap(defaultResources(unrefined), 
        (_, name) => Math.max((Capacities[name] ?? 0)  - (Usages[name] ?? 0), 0));

    return roundResources(income);
}

const calculateRefinedIncome = (faction, trades, name) => {
    const {Resources, Capacities, Usages, Storage: store} = faction;
    const CSCost = Resources.Population/50000;

    const orderedTrades = trades.reduce((group, trade) => group[trade.ID] = trade,[]);
    const storage = 
        faction.Trades.map(id => orderedTrades[id] ?? false).filter(trade => Boolean(trade))
            .map((trade) => {
                return trade[name].Resources;
            })
            .reduce((acc, trade) => addResources(acc, trade), //Adds all trades to storage for calculation
            {...store, CS: store.CS + CSCost})//Includes CS used by Pop
    
    console.log(CSCost);

    const [unrefined, refined, unique] = split(Object.keys(Resources));

    const income = objectMap(defaultResources(refined), 
        (_, name) => {
            return Math.min((Capacities[name] ?? 0) - (Usages[name] ?? 0), Resources[`U-${name}`], storage[name] - Resources[name]);
        });

    const unrefinedCost = objectMap(defaultResources(unrefined), (_, name) => -income[name.slice(2)])


    return roundResources({...unrefinedCost, ...income, CS: income.CS - CSCost});
}

const calculateUniqueIncome = (faction) => {
    const {Resources, Capacities, Usages, Maps} = faction;

    const [unrefined, refined, unique] = split(Object.keys(Resources));

    const income = objectMap(defaultResources(unique),
        (_, name) => {
            switch (name) {
				case "Influence": return calculateInfluence(Resources, Usages, Maps);
                case "Population": return calculatePopulation(Resources, Capacities);
                case "ER": return calculateERIncome(Resources);
                default: return 0;
            }
        }
    );

    return roundResources(income);
}

const fastTrade = (faction, trades, name) => {
    const orderedTrades = [];
    trades.forEach((rade) => orderedTrades[trade.ID] = trade);

    const resources = 
        faction.Trades.map(id => orderedTrades[id] ?? false).filter(trade => Boolean(trade))
            .map((trade) => {
                const target = Object.keys(trade).filter(key => key !== 'ID' || key === name)[0];
                return subResources(trade[target].Resources, trade[name].Resources);
            })
            .reduce((acc, trade) => addResources(acc, trade), faction.Resources)

    return {...faction, Resources: resources};
}

const trade = (factionGroup, resources) => {
    const trades = []
    factionGroup.data.Trades.Active.forEach((trade) => trades[trade.ID] = trade);
    
    const factions = Object.keys(factionGroup).filter(name => name !== "data" && name !== "settings");
    
    const filterResources = (res) => resources.reduce((acc, name) => {return {...acc, [name]: res[name]}}, {})

    const data = factions.reduce((acc,name) => {
        const factionData = factionGroup[name];
        const {Resources: resources, Storage: storage} = factionData;
        const tradeList = 
            factionData.Trades
                .map(id => trades[id] ?? false).filter(trade => Boolean(trade))
                .map(trade => {
                    const target = Object.keys(trade).filter(key => key !== 'ID' || key === name)[0];
                    return {
                        ID: trade.ID,
                        ...trade[name],
                        Resources: filterResources(trade[name].Resources),
                        Debt: trade[name].Debt,
                        Resolved: false,
                        Target: target}
                })
                .sort((a, b) => a.Priority - b.Priority);
        return {
            ...acc,
            [name]: {
                Resources: filterResources(resources),
                Storage: filterResources(storage),
                Trades: tradeList
            }
        }
    }, {})

    if (typeof data !== 'object') return;

    let processing = true;

    while (processing) {
        processing = false;
        for (let name in data) {
            const faction = data[name];
            for (let trade of faction.Trades) {
                if (trade.Resolved) continue;
                const target = data[trade.Target];
                
                const limitedResources = minResources(faction.Resources, trade.Resources);
                const space = maxResources(subResources(target.Storage, target.Resources));
                
                const actuallySent = minResources(space, limitedResources);
                const remainingCost = subResources(trade.Resources, actuallySent);

                data[name].Resources = subResources(faction.Resources, actuallySent);
                target.Resources = addResources(target.Resources, actuallySent);
                trade.Resources = remainingCost;
                
                if (!isEmpty(actuallySent))
                    processing = true; //If resources are sent continue processing
                if (isEmpty(remainingCost))
                    trade.Resolved = true;
                else 
                    break;
            }
        }
    } //Settle most trades

    for (let name in data) {
        const faction = data[name];
        for (let trade of faction.Trades) {
            if (trade.Resolved) continue;
            trade.Debt = addResources(trade.Resources, trade.Debt);
        }
    } //Add Debt

    //Recompile Factions
    for (let trade of trades) {
        const [factionA, factionB] = Object.keys(trade).filter(key => key !== 'ID')
        const factionADebt = data[factionA].Trades.find(a => a.ID === trade.ID).Debt;
        const factionBDebt = data[factionB].Trades.find(b => b.ID === trade.ID).Debt;

        trade[factionA].Debt = factionADebt;
        trade[factionB].Debt = factionBDebt;
    }

    console.log(data.milita.Resources);

    const newFactionGroup = objectMap(factionGroup, (factionData, name) => {
        if (name === 'settings') return factionData;
        if (name === 'data') return {
            ...factionData, 
            Trades: {
                ...factionData.Trades, 
                Active: trades.filter((item) => Boolean(item))
            }};
        return {
            ...factionData,
            Resources: {...factionData.Resources, ...data[name].Resources}
        };
    });

    return newFactionGroup;
}

const performIncome = (factionGroup) => {
    const [unrefined, refined, unique] = split(factionGroup.settings.Resources);

    const unrefinedIncomeFactions = objectMap(factionGroup, (factionData, name) => {
        if (name === 'settings' || name === 'data') return factionData;
        return {
            ...factionData,
            Resources: addResources(factionData.Resources, calculateUnrefinedIncome(factionData))
        }
    });

    
    const unrefinedTradeFactions = trade(unrefinedIncomeFactions, unrefined);
    
    
    const refinedIncomeFactions = objectMap(unrefinedTradeFactions, (factionData, name) => {
        if (name === 'settings' || name === 'data') return factionData;
        return {
            ...factionData,
            Resources: addResources(
                factionData.Resources, 
                calculateRefinedIncome(factionData, factionGroup.data.Trades.Active, name))
        }
    });
    
    const refinedTradeFactions = trade(refinedIncomeFactions, refined)
    
    const uniqueIncomeFactions = objectMap(refinedTradeFactions, (factionData, name) => {
        if (name === 'settings' || name === 'data') return factionData;
        return {
            ...factionData,
            Resources: addResources(factionData.Resources, calculateUniqueIncome(factionData))
        }
    });
    
    const uniqueTradeFactions = trade(uniqueIncomeFactions, unique);
    
    return objectMap(uniqueTradeFactions, (factionData, name) => {
        if (name === 'settings' || name === 'data') return factionData;
        return {
            ...factionData,
            Resources: maxResources(minResources(factionData.Resources, factionData.Storage))
        }
    });
}

const calculateIncome = (faction, trades, name, doTrades) => {
    const tradedFaction = doTrades ? fastTrade(faction, trades, name): faction;

    const unrefinedFaction = {
        ...tradedFaction,
        Resources: addResources(tradedFaction.Resources, calculateUnrefinedIncome(tradedFaction))
    };

    const refinedFaction = {
        ...unrefinedFaction,
        Resources: addResources(unrefinedFaction.Resources, calculateRefinedIncome(unrefinedFaction, [], name))
    };

    const finalResources = addResources(refinedFaction.Resources, calculateUniqueIncome(refinedFaction));

    return subResources(finalResources, faction.Resources);
}

const increaseRate = 0.02;

const sumCN = (c, n) => n*(n+2*c-1)/2;

const buildingScale = (count, amount) => {
    const countPrime = Math.max(count - 26, 0);
    const amountPrime = Math.max(amount - 26 + (count - countPrime),0);
    const newBuildingCount = sumCN(countPrime, amountPrime)

    return amount+increaseRate*newBuildingCount;
}

const buildingCost = (factionData, index, amount = 1) => {
    const buildingCount = objectReduce(factionData.Maps, (a, p) => a + p.Buildings.reduce((a, b) => a + countBuildings(b), 0),0);
    
    const scale = buildingScale(buildingCount, amount);

    return roundResources(scaleResources(factionData.Buildings[index].cost, scale));
}

module.exports = {
    calculateInfluence,
    calculateCapacities, 
    calculateIncome, performIncome,
    buildingScale, buildingCost};
