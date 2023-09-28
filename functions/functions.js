const objectMap = (obj, func) => 
    Object.keys(obj).reduce(
        (acc, key) => {
            return {...acc, [key]: func(obj[key], key, obj)}
        }, {})

const updateIncome = (faction, newMaps, mapData) => {
    const income = faction.Income;
    const maps = faction.Maps;

    const newIncome = Object.keys(newMaps).reduce((accIncome, mapName) => {
        const count = maps[mapName] ?? 0;
        const nCount = newMaps[mapName];
        const data = mapData[mapName].ResourceIncome;

        const mapIncome = objectMap(accIncome, (amount, resource) => {
            const shift = data[resource]*(nCount - count);
            return amount + shift;
        });

        return mapIncome
    }, income);

    return newIncome;
}

module.exports = {objectMap, updateIncome};