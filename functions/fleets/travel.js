const locationList = [
    "Mercury",
    "Venus",
    "Earth",
        "Luna",
    "Mars",
    "Ceres",
    "Vesta",
    "Jupiter",
        "Ganymede",
        "Europa",
        "Io",
        "Callisto",
    "Saturn",
        "Titan",
        "Rhea",
        "Dione",
        "Mimas",
        "Iapetus",
        "Enceladus",
        "Tethys",
    "Uranus",
        "Oberon",
        "Titania",
        "Miranda",
    "Neptune",
        "Triton",
    "Pluto",
        "Charon",

    //Scipian
    "Deo Gloria",
    "Barcas",
    "Scipios",
    "Novai",
];

const locations = {
    Barycenter: "0",
    mercury: "199",
    venus: "299",
    earth: "399",
        luna: "301",
    mars: "499",

    ceres: "1;",
    vesta: "4;",

    jupiter: "599",
        ganymede: "503",
        europa: "502",
        io: "501",
        callisto: "504",
    saturn: "699",
        titan: "606",
        rhea: "605",
        dione: "604",
        mimas: "601",
        iapetus: "608",
        enceladus: "602",
        tethys: "603",
    uranus: "799",
        oberon: "704",
        titania: "703",
        miranda: "705",
    neptune: "899",
        triton: "801",
    pluto: "999",
        charon: "901"
}

const scipianPlanets = {
    "deo gloria": "-1",
    barcas: "-1",
    scipios: "-1",
    novai: "-1",
}

const isValidLocation = (str) => {
    const id = locations[str.toLowerCase()] ?? scipianPlanets[str.toLowerCase()];
    if (typeof id === "string") return true;

    //Handle arbitrary points
    return false;
}

module.exports = {locations, scipianPlanets, isValidLocation};