const { getSolarDate } = require("../dateWork");
const { locations } = require("./travel");
const date = getSolarDate();

const address = (command, center = 0, date = [2024, 3, 26]) => 
    `https://ssd.jpl.nasa.gov/api/horizons.api?` 
    + `command='${command}'`
    + `&CENTER='g@${center}'`
    + `&ephem_type='VECTORS'`
    + `&VEC_TABLE='4'`
    + `&TLIST='${date.join("-")}'`
;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const getLocation = async (location, date) => {
    let requestPlanet = await fetch(address(location, 0, date));
    
    while (requestPlanet.status !== 200) {
        sleep(1000);
        requestPlanet = await fetch(address(location, 0, date));
    }

    const planetString = (await requestPlanet.json()).result;

    const x = Number(planetString.match(/X =[ -]\d\.\d+E[\+-]\d+/g)[0].slice(3));
    const y = Number(planetString.match(/Y =[ -]\d\.\d+E[\+-]\d+/g)[0].slice(3));
    const z = Number(planetString.match(/Z =[ -]\d\.\d+E[\+-]\d+/g)[0].slice(3));
    

    return [x, y, z];
}

const distance = ([x1, y1, z1], [x2, y2, z2]) =>  Math.sqrt((x1 - x2)**2 + (y1 - y2)**2 + (z1 - z2)**2) / 299792.458;

module.exports = {getLocation, distance};

const make2Digits = (i) => i < 10 ? `0${i}`: `${i}`;

// const moons = async () => {
//     console.log("\nNearest Planets\n")

//     const names = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn"]
//     const moons = [locations.mercury, locations.venus, locations.earth, locations.mars, locations.jupiter, locations.saturn];
//     const positions = await Promise.all(moons.map(async (id) => await getLocation(id, date)));

//     const map = new Map();
//     let longestName = 0;

//     for (let i = 0; i < moons.length - 1; i++) {
//         for (let j = i + 1; j < moons.length; j++) {
//             const dist = distance(positions[i], positions[j]);

//             const time = dist*5;

//             map.set(`${names[i]}-${names[j]}`, time)
//             if (longestName < names[i].length + names[j].length + 1) longestName = names[i].length + names[j].length + 1; 
//         }
//     }

//     const arr = Array.from(map);

//     arr.sort(([_, v], [__, o]) => v - o);

//     arr.forEach(([pair, time]) => {
//         const tDays = Math.floor(time/60/60/24);
//         const tHours = make2Digits(Math.floor(time/60/60%24));
//         const tMinutes = make2Digits(Math.floor(time/60%60));
//         const tSeconds = make2Digits(Math.round(time%60));

//         const irpDays = Math.floor(time*12/60/60/24);
//         const irpHours = make2Digits(Math.floor(time*12/60/60%24));
//         const irpMinutes = make2Digits(Math.floor(time*12/60%60));
//         const irpSeconds = make2Digits(Math.round(time*12%60));

//         console.log(`${pair.padStart(longestName, " ")} ${tDays}:${tHours}:${tMinutes}:${tSeconds} irl or ~${irpDays}:${irpHours}:${irpMinutes}:${irpSeconds} irp`);
//     })
    
//     console.log("\n\n");
// }

// const test = async () => {
//     console.log(date.join("/"));
//     const response = await fetch(address(locations.mimas, locations.enceladus, date));
//     const str = (await response.json()).result;

//     console.log(str);

//     const lt = Number(str.match(/LT= \d\.\d+E[\+-]\d+/g)[0].slice(3));

//     const time = lt*5;
//     const tDays = Math.floor(time/60/60/24);
//     const tHours = Math.floor(time/60/60%24);
//     const tMinutes = Math.floor(time/60%60);
//     const tSeconds = time%60;


//     console.log(lt);
//     console.log(`d: ${tDays} h: ${tHours} m: ${tMinutes} s: ${tSeconds}`);
// }

// const listLocations = async () => {
//     const response = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?command='MB'`);
//     const str = (await response.json()).result;

//     console.log(str);
// }


// moons();