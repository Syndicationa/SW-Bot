const { getSolarDate } = require("./dateWork");

const address = (command, center = 0, date = [2024, 3, 26]) => 
`https://ssd.jpl.nasa.gov/api/horizons.api?command='${command}'&ephem_type='VECTORS'&CENTER='g@${center}'&VEC_TABLE='4'&TLIST='${date.join("-")}'`
;

const date = getSolarDate();

const planets = {
    Barycenter: 0,
    Mercury: 199,
    Venus: 299,
    Earth: 399,
    Mars: 499,
    Jupiter: 599,
    Saturn: 699,
    Uranus: 799,
    Neptune: 899,
    Pluto: 999
}

const test = async () => {
    console.log(date.join("/"));
    const response = await fetch(address(planets.Barycenter, planets.Saturn, date));
    const str = (await response.json()).result;

    const lt = Number(str.match(/LT= \d\.\d+E\+\d+/g)[0].slice(3));

    const time = (lt*14.84992319527343)/12;
    const tDays = Math.floor(time/60/60/24);
    const tHours = Math.floor(time/60/60%24);
    const tMinutes = Math.floor(time/60%60);
    const tSeconds = time%60;
    console.log(`d: ${tDays} h: ${tHours} m: ${tMinutes} s: ${tSeconds}`);
}

test();