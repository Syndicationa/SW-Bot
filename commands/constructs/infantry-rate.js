const { SlashCommandBuilder } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/discord/optionHandler');
const { splitCurrency } = require('../../functions/currency');

const inputs = [
    {name: "species", description: "Species of combatants", type: "String", required: true,
        choices: [{name:"Human", value: "human"}, {name: "Robot", value: "robot"}, {name: "Catperson", value: "human"}]},
    {name: "training_time", description: "Specify time of training in months", type: "Integer", required: true},
	{name: "primary", description: "Primary weapon of the soldier", type: "String", required: true,
        choices: [{name: "Assault Rifle", value: "assaultrifle"}, {name: "Machine Gun", value: "machinegun"}, {name: "Sniper Rifle", value: "sniperrifle"}, {name: "Sword", value: "sword"}, {name: "Staff", value: "staff"}]},
    
    {name: "special_forces", description: "Is special forces or not?", type: "Boolean", required: false},
    {name: "chemical_adaptations", description: "how many steriods you gave them", type: "Integer", required: false},
    {name: "physical_adaptations", description: "how many extra organs, reinforced bones you gave them", type: "Integer", required: false},

    // Kit
    {name: "power_suit", description: "power suit", type: "Boolean", required: false},
    {name: "armor", description: "Say, on a scale of 0 to 10, how well would this protect your life?", type: "Integer", required: false},
    {name: "camoflauge", description: "camo", type: "String", required: false,
        choices: [{name: "None", value: "none"}, {name: "Regular", value: "regular"}, {name: "Semi-Active", value: "semiactive"}, {name: "Active", value: "active"}]},
    {name: "shield", description:"Shielding Device", type: "Boolean", required: false},
    
    // Armament
    {name: "grenades", description: "how many do they have", type: "Integer", required: false},
    {name: "missiles", description: "how many missiles does the soldier have (ammo)", type: "Integer", required: false},
    {name: "rockets", description: "how many rockets does the soldier have (ammo)", type: "Integer", required: false},
    {name: "secondary", description: "Secondary weapon of the soldier", type: "String", required: false,
        choices: [{name: "Pistol", value: "pistol"}, {name: "Shotgun", value: "shotgun"}, {name: "Rocket Launcher", value: "rocketlauncher"}, {name: "Missile Launcher", value: "missilelauncher"}, {name: "Knife/Bayonet", value: "knife"}]},
    {name: "name", description: "Name of occupation for soldiers (eg military police, infantry, ect)", type: "String", required: false},
    {name: "other", description: "Other costs", type: "Integer", required: false},


]

const command = new SlashCommandBuilder().setName('infantry-rate').setDescription('Rate Infantry');
generateInputs(command, inputs);

const rateFunction = (values, interaction) => {
	

    const {species, training_time, special_forces, chemical_adaptations, physical_adaptations, 
        power_suit, armor, camoflauge, shield, grenades, missiles, rockets, primary, 
        secondary, name, other} = values;

    const bodyCost = (species == "human") ? 10 : 100;
    const trainCost = (training_time ?? 0) * 0;  // Training cost equals zero
    const specialCost = (special_forces == true) ? 1.1 : 1.0;  // Special forces 20% more expensive
    const chemicalCost = (chemical_adaptations ?? 0) * 15;
    const physicalCost = (physical_adaptations ?? 0) * 25;
    const powersuitCost = (power_suit == true) ? 50 : 0;
    const armorCost = (armor ?? 0) + 1;
    const camoCost = 
        (camoflauge == "active") ? 25 :
        (camoflauge == "semiactive") ? 1 :
        (camoflauge == "regular") ? 0.1 : 0;
    const shieldCost = (shield == true) ? 5 : 0;
    // Armament
    const grenadeCost = (grenades ?? 0) * 0.05;
    const missileCost = (missiles ?? 0) * 5;
    const rocketCost = (rockets ?? 0) * 1;
    const primaryCost =
        (primary == "assaultrifle") ? 1 :
        (primary == "machinegun") ? 50 :
        (primary == "sniperrifle") ? 1 :
        (primary == "sword") ? 15 :
        (primary == "staff") ? 30 : 0;
    const secondaryCost =
        (secondary == "pistol") ? 0.5 :
        (secondary == "shotgun") ? 0.675 :
        (secondary == "rocketlauncher") ? 15 :
        (secondary == "missilelauncher") ? 125 :
        (secondary == "knife") ? 0.05 : 0;
    const otherCost = (other ?? 0);

    const totalCost = (bodyCost + trainCost + chemicalCost + physicalCost + powersuitCost + armorCost + shieldCost + armorCost + camoCost + grenadeCost + rocketCost + missileCost + primaryCost + secondaryCost + otherCost) * specialCost;
    let message = '';
	if (interaction.user.username === "nationalhazard") {
            message = "No adopting chemicals\n"
        }
    const soldierData = "```" +
    `${message}
    Information:
    Human
    MOS: ${(name ?? "Not specified")}
    Cost: $${Math.ceil(totalCost)}k ER
	
    Training time: ${training_time} months training
    Primary weapon: ${(primary ?? "No primary weapon")}
    Secondary weapon: ${secondary ?? "No secondary weapon"}
    Grenades: ${(grenades ?? "None")}
    Armor: ${(armor ?? "0")}/10 
    ${(camoflauge ?? "No")} camoflauge
    Special forces: ${(special_forces ?? "False")}
    Chemical adaptations: ${(chemical_adaptations ?? "None")}
    Physical adaptations: ${(physical_adaptations ?? "None")}
    Power Suit: ${(power_suit ?? "False")}
    Shield: ${(shield ?? "False")}
    Rockets: ${(rockets ?? "None")}
    Missiles: ${(missiles ?? "None")}
    ` +
    "```"
	return soldierData
}


const infantryrate = {
    data: command,
    execute: async (interaction) => {
        const values = retrieveInputs(interaction.options, inputs);
        await interaction.reply(rateFunction(values, interaction));
    }
}

module.exports = infantryrate;