const shutdown = () => {
    console.log("So long!");
	console.log(printDatabase());
	saveLogs(useLogs);
    process.exit()
}

module.exports = {
    name: "SIGINT",
    useProcess: true,
    execute: shutdown
};
