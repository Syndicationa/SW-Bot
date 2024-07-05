const { defaultResources } = require('./currency');
const { objectReduce, objectMap, split } = require('./functions');

const addResources = (resourcesA, resourcesB) => 
    objectMap(resourcesA, 
        (resource, name) => resource + (resourcesB[name] ?? 0)
    );

const subResources = (resourcesA, resourcesB) => 
    objectMap(resourcesA, 
        (resource, name) => resource - (resourcesB[name] ?? 0)
    );

const mulResources = (resourcesA, resourcesB) => 
    objectMap(resourcesA, 
        (resource, name) => resource * (resourcesB[name] ?? 1)
    );

const divResources = (resourcesA, resourcesB) => 
    objectMap(resourcesA, 
        (resource, name) => resource / (resourcesB[name] ?? 1)
    );

const scaleResources = (resourcesA = {}, scale) => 
    objectMap(resourcesA, 
        (resource) => resource*scale
    );

const roundResources = (resources) => objectMap(resources, (a) => Math.round(a));

const minResources = (resourcesA, resourcesB = {}) => 
    objectMap(resourcesA, 
        (resource, name) => Math.min(resource, (resourcesB[name] ?? Infinity))
    );

const maxResources = (resourcesA, resourcesB = {}) => 
    objectMap(resourcesA, 
        (resource, name) => Math.max(resource, (resourcesB[name] ?? 0))
    );

const equResources = (resourcesA, resourcesB = {}) => 
    Object.keys(resourcesA).every((key) => resourcesA[key] === (resourcesB[key] ?? NaN)) && 
    Object.keys(resourcesB).every((key) => resourcesB[key] === (resourcesA[key] ?? NaN));

const calculatePopulation = (res, capacities) => {
    const consumableInfluence = (res.CS + capacities.CS) * 10000/ res.Population;
    const populationGrowth = 
       consumableInfluence <= 0.45 ? -5
       : consumableInfluence < 1 ? ((consumableInfluence - 1)*0.1)
       : consumableInfluence <= 2 ? consumableInfluence*0.025
       : 5;
    const population = res.Population*populationGrowth/100;
    return population;
}

const calculateERIncome = (Resources) => {
    const treasury = Resources.ER
    const workingPopulation = Resources.Population - Resources.Military
    const percentage = 
        treasury <= 250000000000 ? 100
        : treasury <= 15000000000000 ? (-0.0061*(treasury/1000000000 - 250)+100)
        : (12.0095 - Math.log10((treasury/1000000000 - 5699))/2)
    const income = percentage/100 * (
        workingPopulation <= 2000000000 ? 125 * workingPopulation
        : 1000000000*((1.7 * Math.log10(workingPopulation + 1))**2)
    )

    // console.log(treasury, workingPopulation, percentage, income)
    return Math.max(Math.round(income),5000000000);
}

const economicCountBuildings = (buildingObject) => objectReduce(buildingObject ?? {}, (acc, count, level) => (Number(level) + 1)*count + acc, 0);
const countBuildings = (buildingObject) => objectReduce(buildingObject ?? {}, (acc, count) => count + acc, 0);

const calculateIncomeOnWorld = (settingsPlanet, planet, buildings, blank) =>
    planet.Buildings.reduce(
        (acc, building, index) => {
            if (building === null) return acc;
            const count = economicCountBuildings(building);

            const capacities = addResources(mulResources(scaleResources(buildings[index].capacity, count), scaleResources(settingsPlanet.Resources, 1/100)), acc.capacities);
            const storage = addResources(scaleResources(buildings[index].storage, count),acc.storage);

            return {storage, capacities};
        }
        , {storage: blank, capacities: blank}
    )

const calculateIncome = (faction) => {
    const {Resources, Capacities, Usages} = faction;

    const [unrefined, refined, unique] = split(Object.keys(Resources));

    const uniqueIncome = objectMap(defaultResources(unique),
        (_, name) => {
            switch (name) {
                case "Population": return calculatePopulation(Resources, Capacities);
                case "ER": return calculateERIncome(Resources);
                default: return 0;
            }
        }
    )

    const unrefinedIncome = objectMap(defaultResources(unrefined), 
        (_, name) => Math.max((Capacities[name] ?? 0) - (Capacities[name.slice(2)] ?? 0) - (Usages[name] ?? 0) + (Usages[name.slice(2)] ?? 0), -Resources[name]));
    
    const refinedIncome = objectMap(defaultResources(refined), 
        (_, name) => {
            const income = Math.min((Capacities[name] ?? 0) - (Usages[name] ?? 0), Resources[`U-${name}`] + Capacities[`U-${name}`] - Usages[`U-${name}`]);
            if (name === "CS") {
                const cost = Math.round((Resources.Population + uniqueIncome.Population)/50000);
                return income - cost;
            }
            return income
        });

    console.log(`Resources: ${JSON.stringify(Resources)}`);
    console.log(`Unrefined: ${JSON.stringify(unrefinedIncome)}`);

    return {...unrefinedIncome, ...refinedIncome, ...uniqueIncome};
}

const calculateCapacities = (faction, settingMaps, blank) => {
    const {storage, capacities} = objectReduce(faction.Maps,
        (acc, map, name) => {
            const {storage, capacities} = calculateIncomeOnWorld(settingMaps[name], map, faction.Buildings, blank);
            return {
                storage: addResources(storage, acc.storage),
                capacities: addResources(capacities, acc.capacities)
            }
        },
        {storage: blank, capacities: blank}
    )
    return {...faction, Storage: storage, Capacities: capacities};
}

const increaseRate = 0.02;

const sumCN = (c, n) => n*(n+2*c-1)/2;

const buildingCost = (factionData, index, amount = 1) => {
    const buildingCount = objectReduce(factionData.Maps, (a, p) => a + p.Buildings.reduce((a, b) => a + countBuildings(b), 0),0);
    const countPrime = Math.max(buildingCount - 26, 0);
    const amountPrime = Math.max(amount - 26 - (buildingCount - countPrime),0);
    const newBuildingCount = sumCN(countPrime, amountPrime)

    const scale = amount+increaseRate*newBuildingCount;

    return roundResources(scaleResources(factionData.Buildings[index].cost, scale));
}

module.exports = {
    addResources, subResources, mulResources, divResources, scaleResources, 
    countBuildings, roundResources, maxResources, minResources, equResources, 
    calculateCapacities, calculateIncome, buildingCost};
