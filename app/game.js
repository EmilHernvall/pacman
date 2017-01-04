let findClosestPath = require("./pathfinder").findClosestPath;

const KEY_PRESS_COUNT = 7,
      TICKS_PER_GHOST_MOVE = 30;

let createGameState = function(map) {
    return {
        map,
        ghosts: map.getGhostStarts(),
        ticks: 0,
        gameOver: false,
        playerPosition: map.getPlayerStart(),
        keyCounters: {
            up: -1,
            down: -1,
            left: -1,
            right: -1
        },
        processInput(keyMap) {
            this.keyCounters.up = keyMap.up ? this.keyCounters.up + 1 : -1;
            this.keyCounters.down = keyMap.down ? this.keyCounters.down + 1 : -1;
            this.keyCounters.left = keyMap.left ? this.keyCounters.left + 1 : -1;
            this.keyCounters.right = keyMap.right ? this.keyCounters.right + 1 : -1;

            let x = this.playerPosition.x,
                y = this.playerPosition.y;
            if (this.keyCounters.up % KEY_PRESS_COUNT == 0) { y--; }
            if (this.keyCounters.down % KEY_PRESS_COUNT == 0) { y++; }
            if (this.keyCounters.left % KEY_PRESS_COUNT == 0) { x--; }
            if (this.keyCounters.right % KEY_PRESS_COUNT == 0) { x++; }

            if (map.isWall(x,y)) {
                return;
            }

            // Handle teleportation tunnels
            if (x >= map.width) { x = 0; }
            else if (x < 0) { x = map.width - 1; }

            this.playerPosition = { x, y };
        },
        isGhost(pos) {
            for (let i = 0; i < this.ghosts.length; i++) {
                let ghost = this.ghosts[i];
                if (ghost.x == pos.x && ghost.y == pos.y) {
                    return true;
                }
            }
        },
        moveGhosts() {
            if (this.ticks < 5*TICKS_PER_GHOST_MOVE) {
                return;
            }
            if (this.ticks % TICKS_PER_GHOST_MOVE != 0) {
                return;
            }

            for (let ghost of this.ghosts) {
                let bestPath = findClosestPath(map, ghost, this.playerPosition);
                if (bestPath.length == 0) {
                    console.log("Eaten!");
                    this.gameOver = true;
                    return;
                }

                let nextStep = bestPath.pop();
                if (!this.isGhost(nextStep)) {
                    ghost.x = nextStep.x;
                    ghost.y = nextStep.y;
                }
            }
        }
    };
};

module.exports = createGameState;
