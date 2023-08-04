const handleCurrency = (input = "") => {
    const trim = input.trim().toLowerCase();
    const letter = trim.slice(-1);
    if (letter === 'l') letter = trim.slice(-3);
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

module.exports = {handleCurrency};