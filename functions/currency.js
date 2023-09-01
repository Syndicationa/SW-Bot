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
            multiplier *= 1000000;
        break;
        default:
            number = number*10 + Number(letter);
    }
    return number*multiplier
}

const reverseString = str => str.split("").reverse().join("");

const handleReturn = (number = 0) => {
    const reverseSpaced = 
        reverseString(`${number}`).replace(/([0-9]{3})/g,"$1 ");
    const pretty = reverseString(reverseSpaced);
    
    const suffixes = ['(mil)', '(bil)', '(tril)'];
    const end = Math.floor(Math.log10(number) / 3) - 2
    const ending = suffixes[end] ?? '';
    return `${pretty} ${ending}`
}

module.exports = {handleCurrency, handleReturn};