let newMapFromImage = require("./map").newMapFromImage,
    createGameState = require("./game"),
    createGui = require("./gui");

let runGame = function(gameMap) {
    let gameState = createGameState(gameMap);
    let gui = createGui(document.querySelector("#game"));

    let tick = function() {
        gameState.processInput(gui.keyMap);
        gameState.moveGhosts();

        gui.drawMap(gameMap);
        gui.drawState(gameState);

        if (gameState.gameOver) {
            console.log("Game Over!");
            return;
        }

        gameState.ticks++;
        requestAnimationFrame(tick);
    };

    tick();
};

window.addEventListener("load", (e) => {
    console.log("Initializing pacman");
    console.log("Loading map...");
    let imageOfMap = new Image();
    imageOfMap.addEventListener("load", (e) => {
        console.log("Map loaded:",
                    "width =", imageOfMap.width,
                    "height =", imageOfMap.height);

        let map = newMapFromImage(imageOfMap);

        runGame(map);
    });
    imageOfMap.src = "/map.png";
});
