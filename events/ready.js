const { Events } = require('discord.js');

const ready = (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute: ready
};
