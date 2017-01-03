var newMapFromImage = require("./map").newMapFromImage,
    createGameState = require("./game").createGameState,
    createGui = require("./gui");

var runGame = function(gameMap) {
    var gameState = createGameState(gameMap);
    var gui = createGui(document.querySelector("#game"));

    var tick = function() {
        gameState.processInput(gui.keyMap);
        gameState.moveGhosts();

        gui.drawMap(gameMap);
        gui.drawState(gameState);

        gameState.ticks++;

        requestAnimationFrame(tick);
    };

    tick();
};

window.addEventListener("load", (e) => {
    console.log("Loading map");
    var imageOfMap = new Image();
    imageOfMap.addEventListener("load", (e) => {
        console.log("Map loaded:",
                    "width =", imageOfMap.width,
                    "height =", imageOfMap.height);

        var map = newMapFromImage(imageOfMap);
        runGame(map);
    });
    imageOfMap.src = "/map.png";
});
