const { getFaction, setFaction } = require("../../functions/database");
const { generateRow, componentCollector } = require("../../functions/discord/actionHandler");
const commandBuilder = require("../../functions/discord/commandBuilder");
let { EventEmitter } = require('events');

const name = "snake";
const description = "Play Snake";
const inputs = [];
const command = {name, description, inputs};

const firstRow = (up, end) => [
    {
        action: "button",
        label: "_",
        id: "invalid",
        style: "Secondary",
        disabled: true,

        function: () => {}
    },
    {
        action: "button",
        label: "⬆️",
        id: "up",
        style: "Primary",
        disabled: false,

        function: up
    },
    {
        action: "button",
        label: "X",
        id: "close",
        style: "Danger",
        disabled: false,

        function: end
    },
];

const secondRow = (left, down, right) => [
    {
        action: "button",
        label: "⬅️",
        id: "left",
        style: "Primary",
        disabled: false,

        function: left
    },
    {
        action: "button",
        label: "⬇️",
        id: "down",
        style: "Primary",
        disabled: false,

        function: down
    },
    {
        action: "button",
        label: "➡️",
        id: "right",
        style: "Primary",
        disabled: false,

        function: right
    },
];

const directions = {
    "0 -1": "⬆️",
    "0 1":  "⬇️",
    "-1 0": "⬅️",
    "1 0":  "➡️"
}

const drawMap = (head, body, v, apple) => (color = "🟩") => {
    const map = new Array(10).fill("").map(() => new Array(10).fill("⬛"));

    const {x, y} = head;
    map[y][x] = directions[`${v.x} ${v.y}`];

    for (const {x, y} of body) {
        map[y][x] = color;
    }

    const {x: ax, y: ay} = apple;
    map[ay][ax] = "🍎";

    return map.map(row => row.join("")).join("\n");
}

const display = (drawMap, [name, highScore]) => (score, color) => {
    let str = `Score: ${score} | High Score: ${highScore} by ${name}\n`;
    str += drawMap(color);

    return str;
}

const moveSnake = (head, body, v, apple) => {
    body.unshift({x: head.x, y: head.y});
    head.x += v.x + 10;
    head.y += v.y + 10;
    head.x %= 10;
    head.y %= 10;

    if (head.x !== apple.x || head.y !== apple.y) {
        return [false, body.pop()];
    }

    return [true, []];
}

const unmoveSnake = (head, body, tail) => {
    const {x, y} = body.shift();
    body.push(tail);
    head.x = x;
    head.y = y;
}

const moveApple = (apple, head, body) => {
    let x, y;
    while (true) {
        x = Math.floor(Math.random()*10);
        y = Math.floor(Math.random()*10);

        foundEmptySpot = true
        if (x === head.x && y === head.y) continue;

        let escape = true;
        for (const {x: bx, y: by} of body) {
            if (x === bx && y === by) {
                escape = false;
                break;
            }
        }
        if (!escape) continue;
        apple.x = x;
        apple.y = y;
        break;
    }
}

const isDead = (head, body) => {
    for (const {x, y} of body) {
        if (x === head.x && y === head.y) {
            return true;
        }
    }
    return false;
}

const snake = async (interaction) => {
    // await interaction.reply("Sorry, but snake is unavailable right now");
    // return;
    const head = {x: 0, y: 0};
    const body = [];
    let v = {x: 0, y: 1};
    const apple = {x: 5, y: 5};

    const server = interaction.guild.name;
    const highScore = (await getFaction(server, "settings")).SnakeScore;

    const disp = display(drawMap(head, body, v, apple), highScore);

    let score = 0;
    let almostDead = false;
    let dead = false;

    const event = new EventEmitter()

    const playSnake = () => {
        const [grown, tail] = moveSnake(head, body, v, apple);
        const goingToDie = isDead(head, body);

        if (grown) {
            moveApple(apple, head, body);
            score++;
        }

        if (goingToDie) 
            if (!almostDead) {
                almostDead = true;
                unmoveSnake(head, body, tail);
            } else {
                event.emit("dead");
                return;
            }
        else almostDead = false;

        interaction.editReply({content: disp(score)})
    }

    const move = (x, y) => async (i) => {
        if (dead) return;
        if (i.user.id !== interaction.user.id) return;
        if (x === -v.x || y === -v.y) return;
        v.x = x;
        v.y = y;
        i.update(disp(score));
    }

    const up = move(0,-1);
    const down = move(0,1);
    const left = move(-1,0);
    const right = move(1,0);
    const endGame = (i) => {
        if (i.user.id !== interaction.user.id) return;
        event.emit("dead");
    }
    
    const row1 = firstRow(up, endGame);
    const row2 = secondRow(left, down, right);

    const id = setInterval(playSnake, 1000);

    event.on("dead",async () => {
        dead = true;
        clearInterval(id);
        const [oldPlayer, oldScore] = (await getFaction(server, "settings")).SnakeScore;
        let extraInfo = "Good Game\n";

        if (oldScore < score) {
            if (interaction.user.username !== oldPlayer)
                extraInfo += `You beat ${oldPlayer} by ${score - oldScore}\n`
            else
                extraInfo += `You beat your previous best by ${score - oldScore}\n`

            extraInfo += `Amazing! Your score will be recorded, you also win a contraband\n`

            setFaction(server, "settings", {SnakeScore: [interaction.user.username, score]});
        }

        interaction.editReply({
            content: extraInfo + disp(score, "🟥"),
            components: []
        });
    })
    
    const response = await interaction.reply({
        content: disp(score),
        components: [generateRow(row1), generateRow(row2)]
    });
    
    componentCollector([...row1, ...row2], 720_000)(response);
}

const menu = (i, collector) => {
    const selection = i.values[0];
    switch (selection) {
        case "reset":
            head[0] = 0; head[1] = 0;
            body.splice(0, body.length);
            v = [0,1];
            if (score > highScore) highScore = score.score;
            score.score = 0;
            apple[0] = 9; apple[1] = 9;

            i.update({content: display(), components: [generateRow(row1), generateRow(row2)]});
            break;
        case "end":
            collector.stop();
            i.update({content: `Good Game\nHigh Score: ${Math.max(score.score, highScore)}`, components: []})
            break;
    }
}
module.exports = commandBuilder(command, snake);