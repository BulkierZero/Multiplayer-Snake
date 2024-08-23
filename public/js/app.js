//loads the game window after all html is loaded
window.onload = () => {
    const GAME_WINDOW = {
        width: 1000,
        height: 600
    }

    const canvas = document.getElementById("gameWindow");
    const context = canvas.getContext("2d");

    // TODO receive gameOver event from server
    let isGameOver = false;

    //setting window height and width
    canvas.width = GAME_WINDOW.width;
    canvas.height = GAME_WINDOW.height;

    let clientPlayers = {};
    let clientFood = {};
    let localPlayerId = undefined;
    let playerColor = null;

    function initializeSocketIO() {
        const socket = io();

        socket.on('connect', () => localPlayerId = socket.id)
        socket.on('gameOver', (gameOver) => {
            isGameOver = gameOver;
        });

        socket.on("updateClientPlayers", (serverPlayers, serverFood) => {
            clientPlayers = serverPlayers;
            clientFood = serverFood;
        });

        //event listener to get a keydown press event (can i move this to player class?)
        window.addEventListener("keydown", (e) => {
            if (['s', 'w', 'a', 'd'].includes(e.key)) {
                socket.emit('keydown', e.key);
            }
        });
    }
    document.getElementById('dropdown').onclick = function () {
        const dropdownIndex = document.getElementById('dropdown').options.selectedIndex;
        console.log(dropdownIndex)
        if (dropdownIndex === 1){
            playerColor = 'rgba(255, 136, 0, 0.8)'; //orange
        } else if (dropdownIndex === 2){
            playerColor = 'rgba(243, 245, 39, 0.8)'; //yellow
        }else if (dropdownIndex === 3){
            playerColor = 'rgba(0, 255, 0, 0.8)'; //green
        }else {
            playerColor = 'rgba(255, 136, 0, 0.8)'; //default orange
        }
    }

    document.getElementById('startBtn').onclick = function () {
        console.log('GAME START')
        document.getElementById('startScreen').style.display = "none";
        document.getElementById('gameWindow').style.display = "";
        initializeSocketIO();
        window.requestAnimationFrame(frame);
    };



    function drawPlayer(player,playerColor) {
        context.fillStyle = playerColor;
        for (let i = 0; i <= player.body.length - 1; i++)
            context.fillRect(player.body[i][0] * player.cellSize, player.body[i][1] * player.cellSize, player.cellSize, player.cellSize);
    }

    function drawOtherPlayer(player) {
        context.fillStyle = 'rgba(255, 86, 194, 1)';//pinkish
        for (let i = 0; i <= player.body.length - 1; i++)
            context.fillRect(player.body[i][0] * player.cellSize, player.body[i][1] * player.cellSize, player.cellSize, player.cellSize);
    }

    function drawFood(food) {
        context.fillStyle = 'rgba(255,255,255,1)';
        context.fillRect(food.x * food.cellSize, food.y * food.cellSize, food.cellSize, food.cellSize);
    }

    function update() {
        context.clearRect(0, 0, GAME_WINDOW.width, GAME_WINDOW.height);

        if (isGameOver) {
            console.log('game over');
            document.getElementById('gameWindow').style.display = "none";
            document.getElementById('startScreen').style.display = "";
            isGameOver = false;
            window.requestAnimationFrame(frame);
        } else {
            for (const id in clientFood) drawFood(clientFood[id])
            for (const id in clientPlayers) {
                if (localPlayerId !== undefined && id === localPlayerId) {
                    drawPlayer(clientPlayers[id],playerColor)
                } else {
                    drawOtherPlayer(clientPlayers[id])
                }
            }
        }
    }


    //main game loop
    const frame = () => {
        update();
        window.requestAnimationFrame(frame);
    }
}
