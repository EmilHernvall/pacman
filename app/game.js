let findClosestPath = require("./pathfinder").findClosestPath;

const TICKS_PER_PLAYER_MOVE = 15,
      TICKS_PER_GHOST_MOVE = 30,
      TICKS_PER_RETURNING_GHOST_MOVE = 15,
      SUPER_MODE_DURATION = 600;

let createEntity = function(pos, den) {
    return {
        x: pos.x,
        y: pos.y,
        px: pos.x,
        py: pos.y,
        ticks: 0,
        den: den,
        returnToCage: false
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
            den: ghost.den,
            returnToCage: ghost.returnToCage
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

let calculateGhostStep = function(map, ghosts, playerPosition, ticks, superMode) {
    let ghostStarts = map.getGhostStarts();
    for (let i = 0; i < ghosts.length; i++) {
        let ghost = ghosts[i],
            start = ghostStarts[i];

        // Wait until some time has passed before the ghosts awake
        if (ticks < 5*TICKS_PER_GHOST_MOVE) {
            continue;
        }

        // Ghosts only mov on certain time steps, so for the most part
        // we keep them still
        if (ticks % TICKS_PER_GHOST_MOVE != 0 && !ghost.returnToCage) {
            continue;
        } else if (ticks % TICKS_PER_RETURNING_GHOST_MOVE != 0 && ghost.returnToCage) {
            continue;
        }

        let bestPath;
        // The ghost has been touched by the player in super mode, and is
        // returning to the cage
        if (ghost.returnToCage) {
            bestPath = findClosestPath(map, ghost, start);
            if (bestPath.length == 0) {
                ghost.returnToCage = false;
                ghost.den = TICKS_PER_GHOST_MOVE;
            }
        }
        // When the player is in supermode, the ghosts are afraid of the player
        // and wants to get as far away as possible
        else if (superMode) {

            // We do this by enumerating the four corners of the map, and
            // ranking them based on how far away they are from the player.
            let corners = [];
            corners.push({ x: 1, y: 1 });
            corners.push({ x: map.width-2, y: 1 });
            corners.push({ x: 1, y: map.height-2 });
            corners.push({ x: map.width-2, y: map.height-2 });

            let distanceFromPlayer = p => Math.abs(p.x - playerPosition.x) +
                                          Math.abs(p.y - playerPosition.y);
            corners.sort((a,b) => distanceFromPlayer(b) - distanceFromPlayer(a));

            // Then we successively try different corners until we find one
            // with a path that doesn't intersect the player position.
            for (let corner of corners) {
                bestPath = findClosestPath(map, ghost, corner);
                if (!contains(bestPath, playerPosition)) {
                    break;
                }
            }
        }
        // Normally the ghosts will move towarsd the player
        else {
            // Perform an A* search for a path to the player
            bestPath = findClosestPath(map, ghost, playerPosition);
        }

        // If we're at our target, don't move
        if (bestPath.length == 0) {
            continue;
        }

        // Limit the chance of ghosts escaping the cage
        let ghostEscapeDisallowed = Math.random()*100 < 90;

        // Check if the escape hatch is in the path of the active route
        let ghostEscapeInPath = bestPath.filter(p => map.isGhostEscape(p.x, p.y))
                                        .length > 0;

        // Tentative step towards the player, popped after we check the ghost
        // escape path in case the next step is the escape hatch
        let nextStep = bestPath.pop();

        // If:
        //  * The ghost is in the cage...
        //  * ...which implies that it isn't returning _to_ the cage...
        //  * ...and ghost escape isn't allowed...
        // the ghost will shuffle around randomly.
        if (ghostEscapeInPath && ghostEscapeDisallowed && !ghost.returnToCage) {

            // Pick a random move towards a position that is unoccupied
            let adj = map.getAdjacentPaths(ghost.x, ghost.y)
                         .filter(p => !map.isGhostEscape(p.x, p.y) &&
                                      !contains(ghosts, p));
            if (adj.length > 0) {
                nextStep = adj[Math.random()*adj.length|0];
            } else {
                continue;
            }
        }

        // Otherwise, perform normal path finding.
        else {
            // ...unless the block is already occupied
            if (contains(ghosts, nextStep) && !ghost.returnToCage) {
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
        pellets: map.getPellets(),
        superPills: map.getSuperPills(),
        ticks: 0,
        score: 0,
        superModeTick: -SUPER_MODE_DURATION,
        keyCounters: {
            up: -1,
            down: -1,
            left: -1,
            right: -1
        },
        tick(keyMap) {
            let score = this.score;

            let keyCounters = calculateKeyCounters(this.keyCounters, keyMap);

            let playerPosition = calculatePlayerStep(map,
                                                     this.playerPosition,
                                                     keyCounters,
                                                     this.ticks);

            let ghosts = calculateGhostStep(this.map,
                                            copyGhosts(this.ghosts),
                                            this.playerPosition,
                                            this.ticks,
                                            this.isSuperMode());

            // When in supermode, a collision causes the ghosts to return to
            // their starting position
            if (this.isSuperMode()) {
                for (let ghost of ghosts) {
                    if (ghost.x == playerPosition.x &&
                        ghost.y == playerPosition.y) {

                        ghost.returnToCage = true;
                        ghost.den = TICKS_PER_RETURNING_GHOST_MOVE;
                        score += 10;
                        console.log("Ghost beaten! score=" + score);
                    }
                }
            }

            // Check if on pellet
            let pellets = this.pellets;
            if (contains(pellets, playerPosition)) {
                pellets = pellets.filter(p => p.x != playerPosition.x ||
                                              p.y != playerPosition.y);
                score++;
                console.log("Pellet taken! Score: " + score);
            }

            let superPills = this.superPills;
            let superModeTick = this.superModeTick;
            if (contains(superPills, playerPosition)) {
                superPills = superPills.filter(p => p.x != playerPosition.x ||
                                                 p.y != playerPosition.y);
                superModeTick = this.ticks;
                console.log("Super pill taken!");
            }

            return {
                map,
                playerPosition,
                ghosts,
                keyCounters,
                pellets,
                superPills,
                score,
                superModeTick,
                ticks: this.ticks+1,
                tick: this.tick,
                isGameOver: this.isGameOver,
                isSuperMode: this.isSuperMode
            };
        },
        isSuperMode() {
            return this.superModeTick + SUPER_MODE_DURATION > this.ticks;
        },
        isGameOver() {
            return !this.isSuperMode() &&
                   contains(this.ghosts, this.playerPosition);
        }
    };
};

module.exports = createGameState;
