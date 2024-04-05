const { SlashCommandBuilder, EmbedBuilder,  ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const {generateInputs, retrieveInputs} = require('../../functions/createInputs');
const { splitCurrency } = require('../../functions/currency');
const { db } = require('../../firebase');
const { getFaction, setFaction } = require('../../functions/database');
const { log } = require('../../functions/log');
const launcherLog = log('MLauncher')


const inputs = [
    {name: "faction", description: "Name of the Faction", type: "String", required: true},
]

const randInt = (lower, higher) => Math.floor((Math.random()*(higher-lower)) + lower)


const runLauncher = async (interaction) => {
    const arguments = retrieveInputs(interaction.options, inputs);
    const {faction} = arguments;
    const server = interaction.guild.name;
    let error = "";

    const settings = await getFaction(server, "Settings");
    
    const playerData = await getFaction(server, faction);
	const Missions = playerData.Missions;
	let RefinedMissions = [];
	function separate(elemento){
			parts = elemento.split('|');
		RefinedMissions.push(parts[0], parts[1]);
	}
	Missions.forEach(separate);
	
	const ClaimMission1 = new ButtonBuilder()
			.setCustomId('ClaimMission1')
			.setLabel(`end ${RefinedMissions[0]}`)
			.setStyle(ButtonStyle.Primary);
	const ClaimMission2 = new ButtonBuilder()
			.setCustomId('ClaimMission2')
			.setLabel(`end ${RefinedMissions[2]}`)
			.setStyle(ButtonStyle.Primary);
	const ClaimMission3 = new ButtonBuilder()
			.setCustomId('ClaimMission3')
			.setLabel(`end ${RefinedMissions[4]}`)
			.setStyle(ButtonStyle.Primary);
	const ClaimMission4 = new ButtonBuilder()
			.setCustomId('ClaimMission4')
			.setLabel(`end ${RefinedMissions[6]}`)
			.setStyle(ButtonStyle.Primary);
			
	const row = new ActionRowBuilder()
			.addComponents(ClaimMission1, ClaimMission2, ClaimMission3, ClaimMission4);
	const embed = new EmbedBuilder().setColor(0x0099FF).setTitle(`${faction}'s mission control`).setDescription(`Here is all the information about your nation's missions.`).addFields(
		{name: `${RefinedMissions[0]}`, value:`${RefinedMissions[1]}`, inline: true},
		{name: `${RefinedMissions[2]}`, value:`${RefinedMissions[3]}`, inline: true},).addFields(
		{name: `${RefinedMissions[4]}`, value:`${RefinedMissions[5]}`, inline: true},
		{name: `${RefinedMissions[6]}`, value:`${RefinedMissions[7]}`, inline: true},
		).setImage('attachment://control.png').setTimestamp();
	const response = await interaction.reply({ embeds: [ embed ], files: ['./files/control.png'], components: [row]});
	
	
	
	
	
	

	const collectorFilter = i => i.user.id === interaction.user.id;
	try {
		const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000_000 });

		if (confirmation.customId === 'ClaimMission1') {
			
			const MissionLimit = new Date(RefinedMissions[1]);
			let end = 'END';
			let Death = '';
			let Reward = [];
			let amount = '';
			if (MissionLimit < Date.now())
			{
				end = "Mission Completed\nYou've received:";
				const testFolder = './missions.txt';
				const fs = require('fs');
				const path = require('path');
				let RiskReward = [];
				fs.readdirSync(testFolder).forEach(file => {
					console.log(file);

					// read the file content
					var content = fs.readFileSync(path.join(testFolder, file));

					var toSearch = RefinedMissions[0];
					var lines = content.split('\n');

					lines.forEach(l => {
						if(l.indexOf(toSearch) > -1)
						{
							sep = l.split('|');
							RiskReward.push(sep[1], sep[2])
						}
					});
				});
				
				if(RiskReward[1] == 'LOW'){
					amount = randInt(0,250) + `m ER + ` + randInt(0,50) + `CM + ` + randInt(0,50) + `CS + ` + randInt(0,50) + `EL + ` + randInt(0,50) + `U-CM + ` + randInt(0,50) + `U-CS + ` + randInt(0,50) + `U-EL`;
					
				} else if(RiskReward[1] == 'MEDIUM'){
					amount = randInt(250,1000) + `m ER + ` + randInt(20,100) + `CM + ` + randInt(20,100) + `CS + ` + randInt(20,100) + `EL + ` + randInt(20,100) + `U-CM + ` + randInt(20,100) + `U-CS + ` + randInt(20,100) + `U-EL`;
					
				} else if(RiskReward[1] == 'HARD'){
					amount = randInt(1000,5000) + `m ER + ` + randInt(75,250) + `CM + ` + randInt(75,250) + `CS + ` + randInt(75,250) + `EL + ` + randInt(75,250) + `U-CM + ` + randInt(75,250) + `U-CS + ` + randInt(75,250) + `U-EL`;
					
				} else if(RiskReward[1] == 'CRITICAL'){
					amount = randInt(5000,15000) + `m ER + ` + randInt(150,500) + `CM + ` + randInt(150,500) + `CS + ` + randInt(150,500) + `EL + ` + randInt(150,500) + `U-CM + ` + randInt(150,500) + `U-CS + ` + randInt(150,500) + `U-EL`;
					
				}
				const Chance = randInt(0,11);
				if(RiskReward[0] == 'LOW'){
					
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 8)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 9 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'MEDIUM'){
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'HARD'){
					if(Chance >= 0 && Chance <= 3)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 4 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'CRITICAL'){
					if(Chance >= 0 && Chance <= 4)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 5 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				}
				
				const costs = splitCurrency(amount);

				const NaNCosts = costs.some((cost) => isNaN(cost[0]));
				const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
				if (NaNCosts || !isValidType || costs === undefined) {
					error = 'Error in amount';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const factionData = await getFaction(server, faction);
				if (factionData === undefined) {
					error = 'Faction not found';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const resources = factionData.Resources;
				const newResources = {};

				costs.forEach(async (cost) => {
					const resourceName = cost[1]
					const amount = cost[0]
					const nVal = resources[resourceName] + amount;
					
					if (nVal < 0) {
						error = 'Not enough funds';
						refundLog({arguments, error});
						await interaction.reply(error);
						return;
					}

					newResources[resourceName] = nVal;
				})

				setFaction(server, faction, {Resources: {...resources, ...newResources}});
				
				Reward.push(amount);
			}
			else{
				end = "You've recalled your fleets."
				Reward[0] = 'No Rewards'
			}
			
			const embedNew = new EmbedBuilder().setColor(0x0099FF).setTitle(`${faction}'s mission control`).setDescription(`${end}`).addFields(
				{name: `You've gained:`, value:`${Reward[0]}`},
				{name: `At the cost of:`, value:`${Death}`},
				).setImage('attachment://control.png').setTimestamp();
			await confirmation.update({ embeds: [ embedNew ], files: ['./files/control.png'], components: []});
		} else if (confirmation.customId === 'ClaimMission2') {
			
			const MissionLimit = new Date(RefinedMissions[3]);
			let end = 'END';
			let Reward = [];
			let Death = '';
			let amount = '';
			if (MissionLimit < Date.now())
			{
				end = "Mission Completed\nYou've received:";
				const testFolder = './missions.txt';
				const fs = require('fs');
				const path = require('path');
				let RiskReward = [];
				fs.readdirSync(testFolder).forEach(file => {
					console.log(file);

					// read the file content
					var content = fs.readFileSync(path.join(testFolder, file));

					var toSearch = RefinedMissions[2];
					var lines = content.split('\n');

					lines.forEach(l => {
						if(l.indexOf(toSearch) > -1)
						{
							sep = l.split('|');
							RiskReward.push(sep[1], sep[2])
						}
					});
				});
				
				if(RiskReward[1] == 'LOW'){
					amount = randInt(0,250) + `m ER + ` + randInt(0,50) + `CM + ` + randInt(0,50) + `CS + ` + randInt(0,50) + `EL + ` + randInt(0,50) + `U-CM + ` + randInt(0,50) + `U-CS + ` + randInt(0,50) + `U-EL`;
					
				} else if(RiskReward[1] == 'MEDIUM'){
					amount = randInt(250,1000) + `m ER + ` + randInt(20,100) + `CM + ` + randInt(20,100) + `CS + ` + randInt(20,100) + `EL + ` + randInt(20,100) + `U-CM + ` + randInt(20,100) + `U-CS + ` + randInt(20,100) + `U-EL`;
					
				} else if(RiskReward[1] == 'HARD'){
					amount = randInt(1000,5000) + `m ER + ` + randInt(75,250) + `CM + ` + randInt(75,250) + `CS + ` + randInt(75,250) + `EL + ` + randInt(75,250) + `U-CM + ` + randInt(75,250) + `U-CS + ` + randInt(75,250) + `U-EL`;
					
				} else if(RiskReward[1] == 'CRITICAL'){
					amount = randInt(5000,15000) + `m ER + ` + randInt(150,500) + `CM + ` + randInt(150,500) + `CS + ` + randInt(150,500) + `EL + ` + randInt(150,500) + `U-CM + ` + randInt(150,500) + `U-CS + ` + randInt(150,500) + `U-EL`;
					
				}
				const Chance = randInt(0,11);
				if(RiskReward[0] == 'LOW'){
					
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 8)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 9 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'MEDIUM'){
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'HARD'){
					if(Chance >= 0 && Chance <= 3)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 4 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'CRITICAL'){
					if(Chance >= 0 && Chance <= 4)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 5 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				}
				
				const costs = splitCurrency(amount);

				const NaNCosts = costs.some((cost) => isNaN(cost[0]));
				const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
				if (NaNCosts || !isValidType || costs === undefined) {
					error = 'Error in amount';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const factionData = await getFaction(server, faction);
				if (factionData === undefined) {
					error = 'Faction not found';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const resources = factionData.Resources;
				const newResources = {};

				costs.forEach(async (cost) => {
					const resourceName = cost[1]
					const amount = cost[0]
					const nVal = resources[resourceName] + amount;
					
					if (nVal < 0) {
						error = 'Not enough funds';
						refundLog({arguments, error});
						await interaction.reply(error);
						return;
					}

					newResources[resourceName] = nVal;
				})

				setFaction(server, faction, {Resources: {...resources, ...newResources}});
				
				Reward.push(amount);
			}
			else{
				end = "You've recalled your fleets."
				Reward[0] = 'No Rewards'
			}
			
			const embedNew = new EmbedBuilder().setColor(0x0099FF).setTitle(`${faction}'s mission control`).setDescription(`${end}`).addFields(
				{name: `You've gained:`, value:`${Reward[0]}`},
				{name: `At the cost of:`, value:`${Death}`},
				).setImage('attachment://control.png').setTimestamp();
			await confirmation.update({ embeds: [ embedNew ], files: ['./files/control.png'], components: []});
			
			
		} else if (confirmation.customId === 'ClaimMission3') {
			
			const MissionLimit = new Date(RefinedMissions[5]);
			let end = '';
			let Reward = [];
			let Death = '';
			let amount = '';
			if (MissionLimit < Date.now())
			{
				end = "Mission Completed\nYou've received:";
				const testFolder = './missions.txt';
				const fs = require('fs');
				const path = require('path');
				let RiskReward = [];
				fs.readdirSync(testFolder).forEach(file => {
					console.log(file);

					// read the file content
					var content = fs.readFileSync(path.join(testFolder, file));

					var toSearch = RefinedMissions[4];
					var lines = content.split('\n');

					lines.forEach(l => {
						if(l.indexOf(toSearch) > -1)
						{
							sep = l.split('|');
							RiskReward.push(sep[1], sep[2])
						}
					});
				});
				
				if(RiskReward[1] == 'LOW'){
					amount = randInt(0,250) + `m ER + ` + randInt(0,50) + `CM + ` + randInt(0,50) + `CS + ` + randInt(0,50) + `EL + ` + randInt(0,50) + `U-CM + ` + randInt(0,50) + `U-CS + ` + randInt(0,50) + `U-EL`;
					
				} else if(RiskReward[1] == 'MEDIUM'){
					amount = randInt(250,1000) + `m ER + ` + randInt(20,100) + `CM + ` + randInt(20,100) + `CS + ` + randInt(20,100) + `EL + ` + randInt(20,100) + `U-CM + ` + randInt(20,100) + `U-CS + ` + randInt(20,100) + `U-EL`;
					
				} else if(RiskReward[1] == 'HARD'){
					amount = randInt(1000,5000) + `m ER + ` + randInt(75,250) + `CM + ` + randInt(75,250) + `CS + ` + randInt(75,250) + `EL + ` + randInt(75,250) + `U-CM + ` + randInt(75,250) + `U-CS + ` + randInt(75,250) + `U-EL`;
					
				} else if(RiskReward[1] == 'EXTREME'){
					amount = randInt(5000,15000) + `m ER + ` + randInt(150,500) + `CM + ` + randInt(150,500) + `CS + ` + randInt(150,500) + `EL + ` + randInt(150,500) + `U-CM + ` + randInt(150,500) + `U-CS + ` + randInt(150,500) + `U-EL`;
					
				}
				const Chance = randInt(0,11);
				if(RiskReward[0] == 'LOW'){
					
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 8)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 9 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'MEDIUM'){
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'HARD'){
					if(Chance >= 0 && Chance <= 3)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 4 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'EXTREME'){
					if(Chance >= 0 && Chance <= 4)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 5 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				}
				
				const costs = splitCurrency(amount);

				const NaNCosts = costs.some((cost) => isNaN(cost[0]));
				const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
				if (NaNCosts || !isValidType || costs === undefined) {
					error = 'Error in amount';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const factionData = await getFaction(server, faction);
				if (factionData === undefined) {
					error = 'Faction not found';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const resources = factionData.Resources;
				const newResources = {};

				costs.forEach(async (cost) => {
					const resourceName = cost[1]
					const amount = cost[0]
					const nVal = resources[resourceName] + amount;
					
					if (nVal < 0) {
						error = 'Not enough funds';
						refundLog({arguments, error});
						await interaction.reply(error);
						return;
					}

					newResources[resourceName] = nVal;
				})

				setFaction(server, faction, {Resources: {...resources, ...newResources}});
				
				Reward.push(amount);
			}
			else{
				end = "You've recalled your fleets."
				Reward[0] = 'No Rewards'
			}
			
			const embedNew = new EmbedBuilder().setColor(0x0099FF).setTitle(`${faction}'s mission control`).setDescription(`${end}`).addFields(
				{name: `You've gained: (test values, cargo ship capacity will soon determine part of this, needs Syn's help)`, value:`${Reward[0]}`},
				{name: `At the cost of:`, value:`${Death}`},
				).setImage('attachment://control.png').setTimestamp();
			await confirmation.update({ embeds: [ embedNew ], files: ['./files/control.png'], components: []});
		} else if (confirmation.customId === 'ClaimMission4') {
			
			const MissionLimit = new Date(RefinedMissions[7]);
			let end = '';
			let Reward = [];
			let amount = '';
			let Death = '';
			if (MissionLimit < Date.now())
			{
				end = "Mission Completed\nYou've received:";
				const testFolder = './missions.txt';
				const fs = require('fs');
				const path = require('path');
				let RiskReward = [];
				fs.readdirSync(testFolder).forEach(file => {
					console.log(file);

					// read the file content
					var content = fs.readFileSync(path.join(testFolder, file));

					var toSearch = RefinedMissions[6];
					var lines = content.split('\n');

					lines.forEach(l => {
						if(l.indexOf(toSearch) > -1)
						{
							sep = l.split('|');
							RiskReward.push(sep[1], sep[2])
						}
					});
				});
				
				if(RiskReward[1] == 'LOW'){
					amount = randInt(0,250) + `m ER + ` + randInt(0,50) + `CM + ` + randInt(0,50) + `CS + ` + randInt(0,50) + `EL + ` + randInt(0,50) + `U-CM + ` + randInt(0,50) + `U-CS + ` + randInt(0,50) + `U-EL`;
					
				} else if(RiskReward[1] == 'MEDIUM'){
					amount = randInt(250,1000) + `m ER + ` + randInt(20,100) + `CM + ` + randInt(20,100) + `CS + ` + randInt(20,100) + `EL + ` + randInt(20,100) + `U-CM + ` + randInt(20,100) + `U-CS + ` + randInt(20,100) + `U-EL`;
					
				} else if(RiskReward[1] == 'HARD'){
					amount = randInt(1000,5000) + `m ER + ` + randInt(75,250) + `CM + ` + randInt(75,250) + `CS + ` + randInt(75,250) + `EL + ` + randInt(75,250) + `U-CM + ` + randInt(75,250) + `U-CS + ` + randInt(75,250) + `U-EL`;
					
				} else if(RiskReward[1] == 'CRITICAL'){
					amount = randInt(5000,15000) + `m ER + ` + randInt(150,500) + `CM + ` + randInt(150,500) + `CS + ` + randInt(150,500) + `EL + ` + randInt(150,500) + `U-CM + ` + randInt(150,500) + `U-CS + ` + randInt(150,500) + `U-EL`;
					
				}
				const Chance = randInt(0,11);
				let destroyed = 0;
				let damaged = 0;
				switch (RiskReward[0]) {
					case "LOW":
						destroyed = 2;
						damaged = 8;
						break;
					case "MEDIUM":
						destroyed = 2;
						damaged = 9;
						break;
					case "HARD":
						destroyed = 3;
						damaged = 9;
						break;
					case "CRITICAL":
						destroyed = 4;
						damaged = 9;
						break;
					default:
				}

				if(Chance <= destroyed) {
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
				} else if(Chance <= damaged) {
					Death = 'Part of it, needs Syns help to code the fleet losses here.'
				} else {
					Death = 'Nothing. YAY!'
				} 
				
				if(RiskReward[0] == 'LOW'){
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 8)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 9 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'MEDIUM'){
					if(Chance >= 0 && Chance <= 2)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 3 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'HARD'){
					if(Chance >= 0 && Chance <= 3)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 4 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				} else if(RiskReward[0] == 'CRITICAL'){
					if(Chance >= 0 && Chance <= 4)
					{
						amount = '0 ER';
						Death = 'Everything was lost in battle.'
					} else if(Chance >= 5 && Chance <= 9)
					{
						Death = 'Part of it, needs Syns help to code the fleet losses here.'
					} else if(Chance >= 10 && Chance <= 11)
					{
						Death = 'Nothing. YAY!'
					} 
					
				}
				
				const costs = splitCurrency(amount);

				const NaNCosts = costs.some((cost) => isNaN(cost[0]));
				const isValidType = costs.every((cost) => settings.Resources.indexOf(cost[1]) >= 0)
				if (NaNCosts || !isValidType || costs === undefined) {
					error = 'Error in amount';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const factionData = await getFaction(server, faction);
				if (factionData === undefined) {
					error = 'Faction not found';
					refundLog({arguments, error});
					await interaction.reply(error);
					return;
				}

				const resources = factionData.Resources;
				const newResources = {};

				costs.forEach(async (cost) => {
					const resourceName = cost[1]
					const amount = cost[0]
					const nVal = resources[resourceName] + amount;
					
					if (nVal < 0) {
						error = 'Not enough funds';
						refundLog({arguments, error});
						await interaction.reply(error);
						return;
					}

					newResources[resourceName] = nVal;
				})

				setFaction(server, faction, {Resources: {...resources, ...newResources}});
				
				Reward.push(amount);
			}
			else{
				end = "You've recalled your fleets."
				Reward[0] = 'No Rewards'
				Death = 'Nothing.'
			}
			
			const embedNew = new EmbedBuilder().setColor(0x0099FF).setTitle(`${faction}'s mission control`).setDescription(`${end}`).addFields(
				{name: `You've gained:`, value:`${Reward[0]}`},
				{name: `At the cost of:`, value:`${Death}`},
				).setImage('attachment://control.png').setTimestamp();
			await confirmation.update({ embeds: [ embedNew ], files: ['./files/control.png'], components: []});
		}
	} catch (e) {
		const embedcancel = new EmbedBuilder().setColor(0x0099FF).setTitle(`${faction}'s mission control`).setDescription(`Here is all the information about your nation's missions.\n(Display)`).addFields(
		{name: `${RefinedMissions[0]}`, value:`${RefinedMissions[1]}`},
		{name: `${RefinedMissions[2]}`, value:`${RefinedMissions[3]}`},
		{name: `${RefinedMissions[4]}`, value:`${RefinedMissions[5]}`},
		{name: `${RefinedMissions[6]}`, value:`${RefinedMissions[7]}`},
		).setImage('attachment://control.png').setTimestamp();
		console.log(e);
		await interaction.editReply({ embeds: [ embedcancel ], files: ['./files/control.png'], components: [] });
	}
}


const command = new SlashCommandBuilder().setName('missions').setDescription('Missions board');
generateInputs(command, inputs);

const launcher = {
    data: command,
    execute: runLauncher
}

module.exports = launcher;
