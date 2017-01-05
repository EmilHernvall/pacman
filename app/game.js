let findClosestPath = require("./pathfinder").findClosestPath;

const TICKS_PER_PLAYER_MOVE = 15,
      TICKS_PER_GHOST_MOVE = 30;

let createEntity = function(pos, den) {
    return {
        x: pos.x,
        y: pos.y,
        px: pos.x,
        py: pos.y,
        ticks: 0,
        den: den
    };
};

let copyGhosts = function(ghosts) {
    return ghosts.map(ghost => {
        return {
            x: ghost.x,
            y: ghost.y,
            px: ghost.px,
            py: ghost.py,
            ticks: ghost.ticks,
            den: ghost.den
        };
    });
};

let contains = function(set, pos) {
    return set.filter(p => p.x == pos.x &&
                           p.y == pos.y).length > 0;
};

// Update the number of ticks for which each key has been pressed
let calculateKeyCounters = function(keyCounters, keyMap) {
    return {
        up: keyMap.up ? keyCounters.up + 1 : -1,
        down: keyMap.down ? keyCounters.down + 1 : -1,
        left: keyMap.left ? keyCounters.left + 1 : -1,
        right: keyMap.right ? keyCounters.right + 1 : -1
    };
};

// Calculate a new player position based on key counters
let calculatePlayerStep = function(map, player, keyCounters, ticks) {
    let x = player.x,
        y = player.y;

    // We require that each key has been pressed for a certain number of ticks
    // before making a change in position
    let changed = false;
    if (keyCounters.up % TICKS_PER_PLAYER_MOVE == 0) { y--; changed = true; }
    else if (keyCounters.down % TICKS_PER_PLAYER_MOVE == 0) { y++; changed = true; }
    else if (keyCounters.left % TICKS_PER_PLAYER_MOVE == 0) { x--; changed = true; }
    else if (keyCounters.right % TICKS_PER_PLAYER_MOVE == 0) { x++; changed = true; }

    if (map.isWall(x,y)) {
        return player;
    }

    // Handle teleportation tunnels
    if (x >= map.width) { x = 0; changed = false; }
    else if (x < 0) { x = map.width - 1; changed = false; }

    return {
        x,
        y,
        px: changed ? player.x : player.px,
        py: changed ? player.y : player.py,
        ticks: changed ? ticks : player.ticks,
        den: player.den
    };
};

let calculateGhostStep = function(map, ghosts, playerPosition, ticks) {
    for (let ghost of ghosts) {

        // Perform an A* search for a path to the player
        let bestPath = findClosestPath(map, ghost, playerPosition);

        // Should only happen for faulty maps
        if (bestPath.length == 0) {
            continue;
        }

        let ghostEscapeInPath = bestPath.filter(p => map.isGhostEscape(p.x, p.y))
                                        .length > 0;

        // Tentative step towards the player
        let nextStep = bestPath.pop();

        // Limit the chance of ghosts escaping
        let r = Math.random()*100 | 0;
        if (ghostEscapeInPath && r < 80) {
            // Ghost remains inside cage:

            // Pick a random move towards a position that is unoccupied
            let adj = map.getAdjacentPaths(ghost.x, ghost.y)
                         .filter(p => !map.isGhostEscape(p.x, p.y) &&
                                      !contains(ghosts, p));
            if (adj.length > 0) {
                nextStep = adj[Math.random()*adj.length|0];
            } else {
                continue;
            }
        } else {
            // Ghost escapes cage:

            // ...unless the block is already occupied
            if (contains(ghosts, nextStep)) {
                continue;
            }
        }

        ghost.px = ghost.x;
        ghost.py = ghost.y;
        ghost.x = nextStep.x;
        ghost.y = nextStep.y;
        ghost.ticks = ticks;
    }

    return ghosts;
}

let createGameState = function(map) {
    return {
        map,
        playerPositionPrev: null,
        playerPosition: createEntity(map.getPlayerStart(), TICKS_PER_PLAYER_MOVE),
        ghosts: map.getGhostStarts().map(p => createEntity(p, TICKS_PER_GHOST_MOVE)),
        ticks: 0,
        keyCounters: {
            up: -1,
            down: -1,
            left: -1,
            right: -1
        },
        tick(keyMap) {
            let keyCounters = calculateKeyCounters(this.keyCounters, keyMap);

            let playerPosition = calculatePlayerStep(map,
                                                     this.playerPosition,
                                                     keyCounters,
                                                     this.ticks);

            let ghosts;

            // Wait until some time has passed before the ghosts awake
            if (this.ticks < 5*TICKS_PER_GHOST_MOVE) {
                ghosts = copyGhosts(this.ghosts);

            // Ghosts only mov on certain time steps, so for the most part
            // we keep them still
            } else if (this.ticks % TICKS_PER_GHOST_MOVE != 0) {
                ghosts = copyGhosts(this.ghosts);
            }

            // If neither of above criteria matches, calculate new ghost positions
            else {
                ghosts = calculateGhostStep(this.map,
                                            copyGhosts(this.ghosts),
                                            this.playerPosition,
                                            this.ticks);
            }

            return {
                map,
                playerPosition,
                ghosts,
                keyCounters,
                ticks: this.ticks+1,
                tick: this.tick,
                isGameOver: this.isGameOver
            };
        },
        isGameOver() {
            return contains(this.ghosts, this.playerPosition);
        },
    };
};

module.exports = createGameState;
