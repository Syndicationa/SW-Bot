const { ApplicationCommandManager } = require("discord.js");

const splitCurrency = (input = "", def = "ER") => {
    try {
        const trim = input.trim();
        let result = trim.match(/\d+[.,]?\d*(k|[mb](il)?|t(ril)?)?[^\d+|;]*/g).map(stri => {
            const str = stri.trim();
            const number = str.match(/\d+[.,]?\d*(k|[mb](il)?|t(ril)?)?/g)[0];
            const resource = str.split(number).slice(-1)[0].trim();
            return [handleCurrency(number), resource === "" ? def:resource];
            });

        return result;
    } catch (e) {
        return [NaN, def];
    }
}

const handleCurrency = (input = "") => {
    const trim = input.trim().toLowerCase();
    if (trim === "infinity") return Infinity;
    let letter = trim.slice(-1);
    if (letter === 'l') letter = trim.slice(-3);
    if (letter === 'ril') letter = trim.slice(-4);
    const numberStr = trim.slice(0,-1*(letter.length));
    let number = Number(numberStr.replace(',','.'));
    let multiplier = 1;
    switch (letter) {
        case 't':
        case 'tril':
            multiplier *= 1000;
        case 'b':
        case 'bil':
            multiplier *= 1000;
        case 'm':
        case 'mil':
            multiplier *= 1000;
        case 'k':
            multiplier *= 1000;
            break;
        default:
            number = number*10 + Number(letter);
    }
    return number*multiplier
}

const reverseString = str => str.split("").reverse().join("");

const resourceArrayToObject = (arr) => 
    arr.reduce((acc, v) => {
        return {...acc, [v[1]]: v[0]}
    },{})

const handleReturnMultiple = (obj, order = undefined, join = "\n") => { 
    if (Array.isArray(obj)) 
        return handleReturnMultiple(resourceArrayToObject(obj));

    console.log(obj);
    
    let source = order ?? Object.keys(obj).sort();
    
    return source.map(
        (str) => obj[str] === 0 ? undefined:`${handleReturn(obj[str]).trim()} ${str}`
    ).filter((v) => v !== undefined).join(join);
}

const handleReturn = (number = 0) => {
    const reverseSpaced = 
        reverseString(`${number}`).replace(/([0-9]{3})/g,"$1 ");
    const pretty = reverseString(reverseSpaced);
    
    const suffixes = ['(mil)', '(bil)', '(tril)'];
    const end = Math.floor(Math.log10(number) / 3) - 2
    const ending = suffixes[end] ?? '';
    return `${pretty} ${ending}`
}

const defaultResources = settings => settings.Resources.reduce((acc, resourceName) => {return {...acc, [resourceName]: 0}}, {})

const convertToObject = (settings, costList) => costList.reduce(
    (resources, [amount, name]) => {return {...resources, [name]: resources[name] + amount}},
    defaultResources(settings)
);


//console.log(splitCurrency("20b EM; 320m PM + 20 NM"));

module.exports = {splitCurrency, handleCurrency, handleReturnMultiple, handleReturn, defaultResources, convertToObject};