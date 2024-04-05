const splitCurrency = (input = "", def = "ER") => {
    const trim = input.trim();
    let split = trim.split("|");
    split = split.flatMap((str) => str.split("+"));
    split = split.flatMap((str) => str.split(";"));
    split = split.map((str) => str.trim().split(" "));
    split = split.map((arr) => 
        arr.length === 1 ? 
            [arr[0], def.toUpperCase()]:
            [arr[0], arr[1].toUpperCase()]);
    split = split.map(arr => [handleCurrency(arr[0]), arr[1]])

    return split;
}

const handleCurrency = (input = "") => {
    const trim = input.trim().toLowerCase();
    if (trim === "infinity") return Infinity;
    const letter = trim.slice(-1);
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
    
    let source = order ?? Object.keys(obj);
    
    return source.map(
        (str) => `${handleReturn(obj[str]).trim()} ${str}`
    ).join(join);
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


//console.log(splitCurrency("20b EM; 320m PM + 20 NM"));

module.exports = {splitCurrency, handleCurrency, handleReturnMultiple, handleReturn};