const objectMap = (obj, func) => 
    Object.keys(obj).reduce(
        (acc, key) => {
            return {...acc, [key]: func(obj[key], key, obj)}
        }, {})

const objectReduce = (obj, func, start) => typeof obj !== "object" ? start:
    Object.keys(obj).reduce(
        (acc, key) => func(acc, obj[key], key, obj), start)

const split = (resources = ["U-EL", "EL", "ER"]) => {
    const unrefined = resources.filter((v) => v.startsWith("U-"));
    const refined = unrefined.map(str => str.slice(2));
    
    const refinedMap = new Set(refined);
    const unique = resources.filter(str => !refinedMap.has(str) && !refinedMap.has(str.slice(2)));

    return [unrefined, refined, unique];
}

module.exports = {objectMap, objectReduce, split};