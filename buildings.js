const city = {
    name:"City",
    date:{_seconds:1718496000,_nanoseconds:0},
    cost:{
        CM: 5000, "U-CM": 0,
        CS: 5000, "U-CS":0,
        EL: 2500, "U-EL":0,
        Population: 0, Military: 0,
        ER: 1000000000, Influence: 0,
    },
    storage:{
        CM: 0, "U-CM": 0,
        CS: 0, "U-CS": 0,
        EL: 0, "U-EL": 0,
        Population: 500000,
        },
    capacity:{
        CM: 0, "U-CM": 0,
        CS: 0, "U-CS": 0,
        EL: 0, "U-EL": 0,
        Production: 0,
    }
};

const producers = (res, type) => {
    return {
        name: `${res} ${type}`,
        date:{_seconds:1718496000,_nanoseconds:0},
        cost:{
            CM: 20000, "U-CM": 0,
            CS: 0, "U-CS":0,
            EL: 10000, "U-EL":0,
            Population: 0, Military: 0,
            ER: 1000000000, Influence: 0,
        },
        storage:{
            CM: 0, "U-CM": 0,
            CS: 0, "U-CS": 0,
            EL: 0, "U-EL": 0,
            Population: 0,
            },
        capacity:{
            CM: 0, "U-CM": 0,
            CS: 0, "U-CS": 0,
            EL: 0, "U-EL": 0,
            Production: 0,
            [res]: type === "Extractor" ? 10000 : 20000
        }
    };
};

const storage = (res) => {
    return {
        name: `${res} Storage`,
        date:{_seconds:1718496000,_nanoseconds:0},
        cost:{
            CM: 20000, "U-CM": 0,
            CS: 0, "U-CS":0,
            EL: 10000, "U-EL":0,
            Population: 0, Military: 0,
            ER: 1000000000, Influence: 0,
        },
        storage:{
            CM: 0, "U-CM": 0,
            CS: 0, "U-CS": 0,
            EL: 0, "U-EL": 0,
            Population: 0,
            [res]: 100000
            },
        capacity:{
            CM: 0, "U-CM": 0,
            CS: 0, "U-CS": 0,
            EL: 0, "U-EL": 0,
            Production: 0,
        }
    };
};

const production = ["U-CM", "U-CS", "U-EL", "CM", "CS", "EL"].map((name) => producers(name, name.startsWith("U-") ? "Extractor":"Refiner"));
const storages = ["U-CM", "U-CS", "U-EL", "CM", "CS", "EL"].map((name) => storage(name));

const yard = {
    name:"Factory",
    date:{_seconds:1718496000,_nanoseconds:0},
    cost:{
        CM: 20000, "U-CM": 0,
        CS: 0, "U-CS":0,
        EL: 10000, "U-EL":0,
        Population: 0, Military: 0,
        ER: 1000000000, Influence: 0,
    },
    storage:{
        CM: 0, "U-CM": 0,
        CS: 0, "U-CS": 0,
        EL: 0, "U-EL": 0,
        Population: 0,
    },
    capacity:{
        CM: 0, "U-CM": 0,
        CS: 0, "U-CS": 0,
        EL: 0, "U-EL": 0,
        Production: 100,
    }
};

module.exports = [city, ...production, ...storages, yard];