const address = (command, center = 0, date = [2024, 3, 26]) => 
    `https://ssd.jpl.nasa.gov/api/horizons.api?` 
    + `command='${command}'`
    + `&CENTER='@${center}'`
    + `&ephem_type='VECTORS'`
    + `&VEC_TABLE='4'`
    + `&TLIST='${date.join("-")}'`
;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const getLocation = async (location, date) => {
    if (location === "0") return [0,0,0];
    let requestPlanet = await fetch(address(location, 0, date));
    
    let i = 0;
    while (requestPlanet.status !== 200) {
        await sleep(500);
        requestPlanet = await fetch(address(location, 0, date));
        console.log(++i, address(location, 0, date));
    }

    const planetString = (await requestPlanet.json()).result;

    const x = Number(planetString.match(/X =[ -]\d\.\d+E[\+-]\d+/g)[0].slice(3));
    const y = Number(planetString.match(/Y =[ -]\d\.\d+E[\+-]\d+/g)[0].slice(3));
    const z = Number(planetString.match(/Z =[ -]\d\.\d+E[\+-]\d+/g)[0].slice(3));
    

    return [x, y, z];
}

module.exports = {getLocation};

// const test = "8:15|178|0";
// const a = async () => {
//     const test = toStrCoord(await getLocation(locations.titan, date));
//     const result = toStrCoord(fromStrCoord(test));
//     const result2 = toStrCoord(fromStrCoord(result));

//     console.log(test, result, result2);
// }
// a()

// const make2Digits = (i) => i < 10 ? `0${i}`: `${i}`;

// const planets = async () => {
//     console.log("\nNearest Planets\n")

//     const names = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Pluto"]
//     const planets = [locations.mercury, locations.venus, locations.earth, locations.mars, locations.jupiter, locations.pluto];
//     const positions = await Promise.all(planets.map(async (id) => await getLocation(id, date)));

//     positions.forEach((v, i) => {
//         console.log(`${names[i]}: ${toStrCoord(v)}`);
//     })

//     console.log("\n");

//     const map = new Map();
//     let longestName = 0;

//     for (let i = 0; i < planets.length - 1; i++) {
//         for (let j = i + 1; j < planets.length; j++) {
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

// planets();

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