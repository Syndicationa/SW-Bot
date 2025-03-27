export type shipRateInput = {
    length: number,
    main: number,
    secondary: number,
    lances: number,
    pdc: number,
    torpedoes: number,
    shield: boolean,
    stealth: boolean,
    systems: number,
    engines: [number, string][],
    ftl: "EXT" | "INT" | "NONE",
    cargo: number,
    drone: boolean,
    other: number,
    boat: boolean
}

export type shipRateInputPreprocessed = {
    length: number,
    main: number,
    secondary: number,
    lances: number,
    pdc: number,
    torpedoes: number,
    shield: boolean,
    stealth: boolean,
    systems: number,
    engines: string,
    ftl: "EXT" | "INT" | "NONE",
    cargo: number,
    drone: boolean,
    other: number,
    boat: boolean
}

const params = [
    {id: "length", label: "Length of the Ship", type: "number", default: 100},
    {id: "main", label: "Primary Weapon Count", type: "number", default: 0},
    {id: "secondary", label: "Secondary Weapon Count", type: "number", default: 0},
    {id: "lances", label: "Lance-like Weapon Count", type: "number", default: 0},
    {id: "pdc", label: "PDC-like Weapon Count", type: "number", default: 0},
    {id: "torpedoes", label: "Torpedo/Missile Count", type: "number", default: 0},
    {id: "shield", label: "Has a Shield", type: "select", options: ["true", "false"], default: "false"},
    {id: "stealth", label: "Has Stealth", type: "select", options: ["true", "false"], default: "false"},
    {id: "systems", label: "Additional systems", type: "number", default: 0},
    {id: "engines", label: "Engines (format: '4S 2M 1L')", type: "text", default: "0"},
    {id: "ftl", label: "FTL Type", type: "select", options: ["EXT", "INT", "NONE"], default: "NONE"},
    {id: "cargo", label: "Cargo Space (1 unit per meter)", type: "number", default: 0},
    {id: "drone", label: "Is a drone", type: "select", options: ["true", "false"], default: "false"},
    {id: "other", label: "Other Costs", type: "number", default: 0},
    {id: "boat", label: "Is a boat", type: "select", options: ["true", "false"], default: "false"}
]

const er = (values: shipRateInput): number => {
    const {
        length, main, secondary, 
        lances, pdc, torpedoes, 
        shield, stealth, 
        systems, engines, ftl, 
        cargo, drone, other
    } = values;
    
    const ftlModifier = ftl === "NONE" ? 0 : 1500; 
    const lCost = length * (24 + (stealth ? 2 : 0) + ftlModifier);
    
    const mCost = main * 15;
    const seCost = secondary * 10;
    const lanCost = lances * 50;
    const pCost = pdc * 5;
    const tCost = torpedoes * 5;
    
    const oCost = other;
    const sCost = shield ? 300 : 0;
    const sysCost = systems * length;

    const cargoCost = cargo * 1;
    const droneDiscount = drone ? 0.85 : 1;

    const engineCosts: Record<string, number> = {S: 5.5, M: 7.5, L: 10.5};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc : acc + (count * engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + oCost + cargoCost) * droneDiscount / 1000;
}

const cm = (values: shipRateInput): number => {
    const {
        length, main, secondary, 
        lances, pdc, torpedoes, 
        shield, stealth, 
        systems, engines, ftl, 
        cargo, drone
    } = values;
    
    const ftlModifier = ftl === "NONE" ? 0 : (ftl === "INT" ? 60 : 40); 
    const lCost = length * (50 + (stealth ? 20 : 0) + ftlModifier);
    
    const mCost = main * 100;
    const seCost = secondary * 50;
    const lanCost = lances * 300;
    const pCost = pdc * 25;
    const tCost = torpedoes * 25;
    
    const sCost = shield ? 1000 : 0;
    const sysCost = systems * length;

    const cargoCost = cargo * 10;
    const droneDiscount = drone ? 1.2 : 1;

    const engineCosts: Record<string, number> = {S: 50, M: 70, L: 100};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc : acc + (count * engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + cargoCost) * droneDiscount;
}

const el = (values: shipRateInput): number => {
    const {
        length, main, secondary, 
        lances, pdc, torpedoes, 
        shield, stealth, 
        systems, engines, ftl, 
        cargo, drone
    } = values;
    
    const ftlModifier = ftl === "NONE" ? 0 : (ftl === "INT" ? 20 : 10);  
    const lCost = length * ((stealth ? 10 : 0) + ftlModifier);
    
    const mCost = main * 100;
    const seCost = secondary * 100;
    const lanCost = lances * 200;
    const pCost = pdc * 100;
    const tCost = torpedoes * 100;
    
    const sCost = shield ? 1000 : 0;
    const sysCost = systems * length * 2;

    const cargoCost = cargo * 5;
    const droneDiscount = drone ? 1.5 : 1;

    const engineCosts: Record<string, number> = {S: 50, M: 70, L: 100};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc : acc + (count * engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + tCost + sCost + sysCost + engineCost + cargoCost) * droneDiscount;
}

const cs = (values: shipRateInput): number => {
    const {
        length, main, secondary, 
        lances, pdc,
        systems, engines, ftl, 
        drone
    } = values;    
    
    const ftlModifier = ftl === "NONE" ? 0 : 10; 
    const lCost = length * (5 + ftlModifier);
    
    const mCost = main * 10;
    const seCost = secondary * 10;
    const lanCost = lances * 20;
    const pCost = pdc * 10;

    const sysCost = systems * length * 2;

    const droneDiscount = drone ? 0.5 : 1;

    const engineCosts: Record<string, number> = {S: 10, M: 20, L: 30};
    const engineCost = engines.reduce((acc, [count, type]) => 
        (isNaN(count) || engineCosts[type] === undefined) ? acc : acc + (count * engineCosts[type]), 0);

    return (lCost + mCost + seCost + lanCost + pCost + sysCost + engineCost) * droneDiscount;
}

const splitCurrency = (input = "", def = "ER") => {
    try {
        const trim: any = input.trim();
        const enginePattern = /(\d+)([SML])\s*/g;
        let match;
        const result: [number, string][] = [];
        
        while ((match = enginePattern.exec(trim)) !== null) {
            const count = parseInt(match[1], 10);
            const engineType = match[2];
            result.push([count, engineType]);
        }
        
        return result.length > 0 ? result : [[NaN, def]];
    } catch (e) {
        return [[NaN, def]];
    }
}

const rate = (values: shipRateInputPreprocessed) => {
    const multiplier = values.boat ? 0.85 : 1;
    
    const valuesCopy = { ...values };
    const processed: any = valuesCopy;
    processed.engines = splitCurrency(valuesCopy.engines ?? "0", "M");

    return {
        er: Math.ceil(er(processed) * 1000000000 * multiplier),
        cm: Math.ceil(cm(processed) * multiplier),
        cs: Math.ceil(cs(processed) * multiplier),
        el: Math.ceil(el(processed) * multiplier),
        cs_upkeep: Math.ceil(cs(processed) * multiplier / 6)
    }
}

export default {
    rate: rate,
    params: params
}