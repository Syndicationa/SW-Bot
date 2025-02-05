const { getSolarDate } = require("../dateWork");
const { getLocation } = require("./horizons");
const { locations, scipianPlanets } = require("./locations");

const isStrCoord = str => str.match(/(\d+:)*\d+\|\d+\|\d+/g) !== null;

const isValidLocation = (str) => {
    const id = locations[str.toLowerCase()] ?? scipianPlanets[str.toLowerCase()];
    if (typeof id === "string") return true;
    
    return isStrCoord(str);
}

const light = 299792.458;
const perLight = 1 / light;

const distance = ([x1, y1, z1], [x2, y2, z2]) =>  Math.sqrt((x1 - x2)**2 + (y1 - y2)**2 + (z1 - z2)**2) * perLight;

const time = [60, 60, 24, 7];

const toStrCoord = ([x,y,z]) => {
    const r = Math.round(Math.sqrt(x**2 + y**2 + z**2))
    const ls = Math.round(r * perLight);

    const lTime = [ls];
    for (let i = 0; i < time.length; i++) {
        const div = time[i];

        if (lTime[0] < div) break;
        lTime.unshift(Math.floor(lTime[0] / div));
        lTime[1] %= div;
        if (lTime[1] < 10 && div > 10) lTime[1] = "0" + lTime[1];
    }

    const angleCount = ls*2;

    const d = Math.round(ls * light);
    const theta = (Math.round(Math.acos(y/d)*ls / Math.PI) + angleCount) % angleCount;
    const phi = (Math.round(Math.atan2(z, x)*ls / Math.PI) + angleCount) % angleCount;

    return `${lTime.join(":")}|${theta}|${phi}`;
}

const fromStrCoord = (str) => {
    const [timeStr, theta, phi] = str.split("|");
    const timeArray = timeStr.split(":").map((n) => Number(n));

    let ls = 0;
    let tIndex = timeArray.length - 1;
    for (let i = 0; i < timeArray.length; i++, tIndex--) {
        ls *= time[tIndex] ?? 1;
        ls += timeArray[i];
    }

    const thetaAngle = Number(theta) / ls * Math.PI;
    const phiAngle = Number(phi) / ls * Math.PI;

    const d = Math.round(ls * light);
    const x = d*Math.cos(phiAngle)*Math.sin(thetaAngle);
    const y = d*Math.cos(thetaAngle);
    const z = d*Math.sin(phiAngle)*Math.sin(thetaAngle);

    return [x, y, z]
}

let date = getSolarDate();
let fixing = false;

const dataBlock = new Map();
const timeMap = new Map();

const setupTimeMap = () => {
    for (const location in dataBlock) {
        const [x, y, z] = dataBlock[location];
        const r = Math.round(Math.sqrt(x**2 + y**2 + z**2))
        const lightMinutes = Math.round(r * perLight / 60);

        const currentData = timeMap.get(lightMinutes) ?? [];
        currentData.push(location);
        timeMap.set(lightMinutes, currentData);
    }

    console.log(timeMap);
}

const setupDataBlock = async () => {
    if (fixing) return;
    fixing = true;
    console.time("Sol")
    for (const key in locations) {
        console.time(key);
        dataBlock[key] = await getLocation(locations[key], date);
        console.timeEnd(key);
    }
    console.timeEnd("Sol");
    
    setupTimeMap();
    fixing = false;
}
// setupDataBlock();

const getLocationFromName = async (tName) => {
    const name = tName.toLowerCase();
    if (isStrCoord(name)) return fromStrCoord(name);

    if (!isValidLocation(name)) throw "Invalid Location"; 

    if (date === getSolarDate()) return dataBlock.get(name);
    if (scipianPlanets[name]) return [0, light * 60 * 60 * 24 * 14, 0];

    date = getSolarDate();
    setupDataBlock();

    return await getLocation(locations[name], date);
}

module.exports = { isValidLocation };