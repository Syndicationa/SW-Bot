const { objectReduce, objectMap } = require('./functions');

const addResources = (resourcesA, resourcesB) => 
    objectMap(resourcesA, 
        (resource, name) => resource + (resourcesB[name] ?? 0)
    );

const mulResources = (resourcesA, resourcesB) => 
    objectMap(resourcesA, 
        (resource, name) => resource * (resourcesB[name] ?? 1)
    );

const scaleResources = (resourcesA, scale) => 
    objectMap(resourcesA, 
        (resource) => resource*scale
    );

const roundResources = (resources) => objectMap(resources, (a) => Math.round(a));

const maxResources = (resourcesA, resourcesB = {}) => 
    objectMap(resourcesA, 
        (resource, name) => Math.max(resource, (resourcesB[name] ?? 0))
    );

const calculatePopulation = (faction) => {
    const res = faction.Resources
    const consumableInfluence = res.CS * 10000/ res.Population;
    const populationGrowth = 
       consumableInfluence <= 0.45 ? -5
       : consumableInfluence < 1 ? ((consumableInfluence - 1)*0.1)
       : consumableInfluence <= 2 ? consumableInfluence*0.025
       : 5;
    const population = res.Population*populationGrowth/100;
    return {...faction, Income: {...faction.Income, Population: population}}
}

const calculateERIncome = (faction) => {
    const treasury = faction.Resources.ER
    const workingPopulation = faction.Resources.Population - faction.Resources.Military
    const percentage = 
        treasury <= 250000000000 ? 100
        : treasury <= 15000000000000 ? (-0.0061*(treasury/1000000000 - 250)+100)
        : (12.0095 - Math.log10((treasury/1000000000 - 5699))/2)
    const income = percentage/100 * (
        workingPopulation <= 2000000000 ? 125 * workingPopulation
        : 1000000000*((1.7 * Math.log10(workingPopulation + 1))**2)
    )

    // console.log(treasury, workingPopulation, percentage, income)
    return {...faction, Income: {...faction.Income, ER: income}}
}

const countBuildings = (buildingObject) => objectReduce(buildingObject, (acc, count, level) => (Number(level) + 1)*count + acc, 0);

const calculateIncomeOnWorld = (settingsPlanet, planet, buildings, blank) =>
    planet.Buildings.reduce(
        (acc, building, index) => 
            addResources(mulResources(scaleResources(buildings[index].income, countBuildings(building)), settingsPlanet.Resources), acc)
        , blank
    )

const calculateIncome = (faction, settingMaps, blank) => {
    const buildingIncome = objectReduce(faction.Maps,
        (acc, map, name) => addResources(calculateIncomeOnWorld(settingMaps[name], map, faction.Buildings, blank), acc),
        blank
    )
    return calculateERIncome(calculatePopulation({...faction, Income: buildingIncome}))
}

module.exports = {addResources, mulResources, scaleResources, roundResources, maxResources, calculateIncome};
