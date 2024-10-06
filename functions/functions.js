const objectMap = (obj, func) => {
    if (typeof obj !== "object") return obj;

    const acc = {};
    for (key in obj) {
        acc[key] = func(obj[key], key, obj)
    }
    return acc;
}

const objectReduce = (obj, func, start) => {
    if (typeof obj !== "object") return obj;

    let acc = start;
    for (key in obj) {
        if (acc === undefined) {
            acc = obj[key]
            continue;
        }
        acc = func(acc, obj[key], key, obj)
    }
    return acc;
}

const objectFilter = (obj, func) => {
    if (typeof obj !== "object") return obj;

    const acc = {};
    for (key in obj) {
        if (func(obj[key], key, obj))
            acc[key] = obj[key]
    }
    return acc;
}

const split = (resources = ["U-EL", "EL", "ER"]) => {
    const unrefined = resources.filter((v) => v.startsWith("U-"));
    const refined = unrefined.map(str => str.slice(2));
    
    const refinedMap = new Set(refined);
    const unique = resources.filter(str => !refinedMap.has(str) && !refinedMap.has(str.slice(2)));

    return [unrefined, refined, unique];
}

module.exports = {objectMap, objectReduce, objectFilter, split};