const objectMap = (obj, func) => 
    Object.keys(obj).reduce(
        (acc, key) => {
            return {...acc, [key]: func(obj[key], key, obj)}
        }, {})

const objectReduce = (obj, func, start) => typeof obj !== "object" ? start:
    Object.keys(obj).reduce(
        (acc, key) => func(acc, obj[key], key, obj), start)

module.exports = {objectMap, objectReduce};