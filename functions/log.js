const {fs} = require("fs")

const logs = [];

const exampleLog = {
    command: "treasury",
    arguments: {nation: "Bobia"},
    error: "Nation doesn't exist",
    time: new Date(),
};

const log = command => ({arguments, error}) => {
    logs.push({
        command,
        arguments,
        error,
        time: new Date()
    })
    console.log(convertLog(logs[logs.length - 1]));
}

const day = (time = new Date()) => `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()}`;

const convertLog = ({time, command, arguments, error} = exampleLog) => {
    const timeStr = 
    `[${day(time)} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}]`;
    return `${timeStr} ${error} ${command} ${JSON.stringify(arguments)}`;
}

const saveLogs = save => {
    if (!save) return;
    const fileName = `../logs/${day().replace("/","-")}.txt`
    logs.forEach((log) => {
        const str = convertLog(log);
        fs.appendFile(fileName, str);
    })
}

module.exports = {log, saveLogs};