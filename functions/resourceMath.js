const { defaultResources } = require('./currency');
const { objectReduce, objectMap, split } = require('./functions');

const addResources = (resourcesA = {}, resourcesB = {}) => 
    objectMap({...resourcesA, ...resourcesB}, 
        (_, name) => (resourcesA[name] ?? 0) + (resourcesB[name] ?? 0)
    );

const subResources = (resourcesA = {}, resourcesB = {}) => 
    objectMap({...resourcesA, ...resourcesB}, 
        (_, name) => (resourcesA[name] ?? 0) - (resourcesB[name] ?? 0)
    );

const mulResources = (resourcesA = {}, resourcesB = {}) => 
    objectMap({...resourcesA, ...resourcesB}, 
        (_, name) => (resourcesA[name] ?? 0) * (resourcesB[name] ?? 1)
    );

const divResources = (resourcesA = {}, resourcesB = {}) => 
    objectMap({...resourcesA, ...resourcesB}, 
        (_, name) => (resourcesA[name] ?? 0) / (resourcesB[name] ?? 1)
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

const isEmpty = (resources) => objectReduce(resources, (acc, num) => acc && num === 0, true);

const validResources = (resources) => objectReduce(resources, (acc, num) => acc && num >= 0, true)

const economicCountBuildings = (buildingObject) => objectReduce(buildingObject ?? {}, (acc, count, level) => (Number(level) + 1)*count + acc, 0);
const countBuildings = (buildingObject) => objectReduce(buildingObject ?? {}, (acc, count) => count + acc, 0);

    module.exports = {
        addResources, subResources, mulResources, divResources, scaleResources, 
        roundResources, maxResources, minResources, equResources, isEmpty, validResources,
        countBuildings, economicCountBuildings};