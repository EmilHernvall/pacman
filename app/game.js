const KEY_PRESS_COUNT = 7,
      TICKS_PER_GHOST_MOVE = 30;

var createGhost = function(position) {
    return {
        position,
        pathToPlayer(map, playerPos) {
            return map.findClosestPath(this.position, playerPos);
        }
    };
};

var createGameState = function(map) {
    var playerStart = map.getPlayerStart();
    console.log("playerStart:", playerStart);

    var ghosts = map.getGhostStarts().map(x => createGhost(x));

    return {
        map,
        ghosts,
        ticks: 0,
        playerPosition: playerStart,
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

            var x = this.playerPosition.x,
                y = this.playerPosition.y;
            if (this.keyCounters.up % KEY_PRESS_COUNT == 0) {
                y--;
            }
            if (this.keyCounters.down % KEY_PRESS_COUNT == 0) {
                y++;
            }
            if (this.keyCounters.left % KEY_PRESS_COUNT == 0) {
                x--;
            }
            if (this.keyCounters.right % KEY_PRESS_COUNT == 0) {
                x++;
            }

            if (map.isWall(x,y)) {
                return;
            }

            if (x >= map.width) {
                x = 0;
            } else if (x < 0) {
                x = map.width - 1;
            }

            this.playerPosition = { x, y };
        },
        isGhost(pos) {
            for (var i = 0; i < this.ghosts.length; i++) {
                var ghost = this.ghosts[i];
                if (ghost.position.x == pos.x && ghost.position.y == pos.y) {
                    return true;
                }
            }
        },
        moveGhosts() {
            if (this.ticks > 5*TICKS_PER_GHOST_MOVE &&
                this.ticks % TICKS_PER_GHOST_MOVE == 0) {

                console.log("ghost paths");
                this.ghosts.forEach(ghost => {
                    var bestPath = ghost.pathToPlayer(this.map, this.playerPosition);
                    if (bestPath.length == 0) {
                        return;
                    } else if (bestPath.length == 1) {
                        console.log("Eaten!");
                    }

                    bestPath.pop();
                    var nextStep = bestPath.pop();
                    if (!this.isGhost(nextStep)) {
                        ghost.position = nextStep;
                    }
                });
            }
        }
    };
};

module.exports = {
    createGameState
};
