const locations = {
    Barycenter: "0",
    mercury: "199",
    venus: "299",
    earth: "399",
        luna: "301",
    mars: "499",

    ceres: "Ceres",
    vesta: "Vesta",

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

const map = {
    Earth: ["Earth", "Luna"],
    Belt: ["Ceres", "Vesta"],
    Jupiter: ["Jupiter", "Ganymede", "Europa", "Io", "Callisto"],
    Saturn: ["Saturn", "Titan", "Rhea", "Dione", "Mimas", "Iapetus", "Enceladus", "Tethys"],
    Uranus: ["Uranus", "Oberon", "Titania", "Miranda"],
    Neptune: ["Neptune", "Triton"],
    Pluto: ["Pluto", "Charon"],
    Scipio: ["Deo Gloria", "Barcas", "Scipios", "Novai"]
}

const planets = [
    "Mercury", "Venus", "Earth", "Mars", "Belt",
    "Jupiter", "Saturn", "Uranus", "Neptune",
    "Pluto", "Scipio"
]

const scipianPlanets = {
    "deo gloria": "-1",
    barcas: "-1",
    scipios: "-1",
    novai: "-1",
}

module.exports = {map, planets, locations, scipianPlanets};