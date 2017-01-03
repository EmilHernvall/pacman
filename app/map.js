const BITS_PER_COORDINATE = 5,
      MAX_MAP_WIDTH = 1 << 5,
      MAX_MAP_HEIGHT = 1 << 5,
      BUFFER_SLOTS = (1 << (2*BITS_PER_COORDINATE)),
      COORDINATE_BIT_MASK = (1 << 5) - 1;

const SLOTTYPE_EMPTY = 0,
      SLOTTYPE_WALL = 1,
      SLOTTYPE_PLAYERSTART = 2,
      SLOTTYPE_GHOSTSTART = 3,
      SLOTTYPE_GHOSTESCAPE = 4;

var packCoords = function(x,y) {
    return ((x & COORDINATE_BIT_MASK) << BITS_PER_COORDINATE) |
           (y & COORDINATE_BIT_MASK);
};

var unpackCoords = function(c) {
    var x = (c >> BITS_PER_COORDINATE) & COORDINATE_BIT_MASK,
        y = c & COORDINATE_BIT_MASK;

    return { x, y };
};

var createNodeSet = function() {
    return {
        nodes: {},
        length: 0,
        add(node) {
            var c = packCoords(node.x, node.y);
            this.length++;
            this.nodes[c] = true;
        },
        contains(node) {
            var c = packCoords(node.x, node.y);
            return this.nodes[c] === true;
        },
        remove(node) {
            var c = packCoords(node.x, node.y);
            delete this.nodes[c];
            this.length--;
        },
        findShortest(scores) {
            var bestNode = null,
                minScore = Number.POSITIVE_INFINITY;
            for (var idx in this.nodes) {
                var node = this.nodes[idx],
                    score = scores.get(unpackCoords(idx));

                if (score < minScore) {
                    bestNode = idx;
                    minScore = score;
                }
            }

            return unpackCoords(bestNode);
        }
    };
};

var createCostMap = function() {
    return {
        nodes: {},
        set(node, cost) {
            var c = packCoords(node.x, node.y);
            this.nodes[c] = cost;
        },
        get(node) {
            var c = packCoords(node.x, node.y);
            if (typeof this.nodes[c] === "undefined") {
                return Number.POSITIVE_INFINITY;
            }

            return this.nodes[c];
        }
    };
};

var createNodeToNodeMap = function() {
    return {
        nodes: {},
        set(node, target) {
            var c = packCoords(node.x, node.y);
            this.nodes[c] = target;
        },
        get(node) {
            var c = packCoords(node.x, node.y);
            return this.nodes[c];
        },
        contains(node) {
            var c = packCoords(node.x, node.y);
            return typeof this.nodes[c] !== "undefined";
        }
    };
};

var newMapFromImage = function(imageOfMap) {
    var width = imageOfMap.width,
        height = imageOfMap.height;

    var localCanvas = document.createElement("CANVAS");
    localCanvas.width = width;
    localCanvas.height = height;

    var ctx = localCanvas.getContext("2d");
    ctx.drawImage(imageOfMap, 0, 0, width, height);

    var data = ctx.getImageData(0, 0, width, height).data;
    var mapData = new Uint8Array(BUFFER_SLOTS);
    for (var idx = 0; idx < data.length; idx += 4) {
        var properIdx = idx / 4,
            x = properIdx % width,
            y = (properIdx / width) | 0,
            newIdx = packCoords(x,y),
            r = data[idx + 0],
            g = data[idx + 1],
            b = data[idx + 2],
            c = ((r << 16) | (g << 8) | b);

        if (c === 0xFFFFFF) { // empty
            mapData[newIdx] = SLOTTYPE_EMPTY;
        } else if (c === 0xFF0000) { // ghost start
            mapData[newIdx] = SLOTTYPE_GHOSTSTART;
        } else if (c === 0x00FF00) { // player start
            mapData[newIdx] = SLOTTYPE_PLAYERSTART;
        } else if (c === 0x0000FF) { // ghost escape
            mapData[newIdx] = SLOTTYPE_GHOSTESCAPE;
        } else { // wall
            mapData[newIdx] = SLOTTYPE_WALL;
        }
    }

    return createMap(width, height, mapData);
};

var createMap = function(width, height, buffer) {
    return {
        width,
        height,
        buffer,
        getAdjacentPaths(x, y) {
            var paths = [];

            paths.push({ x: x, y: y-1 }); // Above
            paths.push({ x: x-1, y: y }); // Left
            paths.push({ x: x+1, y: y }); // Right
            paths.push({ x: x, y: y+1 }); // Below

            return paths.filter(p => !this.isWall(p.x, p.y) ||
                                     this.isGhostEscape(p.x, p.y));
        },
        isWall(x,y) {
            var c = this.buffer[packCoords(x,y)];
            return c === SLOTTYPE_WALL || c == SLOTTYPE_GHOSTESCAPE;
        },
        isGhostEscape(x,y) {
            var c = this.buffer[packCoords(x,y)];
            return c == SLOTTYPE_GHOSTESCAPE;
        },
        getPlayerStart() {
            for (var i = 0; i < buffer.length; i++) {
                var c = buffer[i];
                if (c == SLOTTYPE_PLAYERSTART) {
                    return unpackCoords(i);
                }
            }

            return;
        },
        getGhostStarts() {
            var ghostStarts = [];
            for (var i = 0; i < buffer.length; i++) {
                var c = buffer[i];
                if (c == SLOTTYPE_GHOSTSTART) {
                    ghostStarts.push(unpackCoords(i));
                }
            }

            return ghostStarts;
        },
        findClosestPath(start, goal) {
            var reconstructPath = function(cameFrom, current) {
                var totalPath = [current];
                while (cameFrom.contains(current)) {
                    current = cameFrom.get(current);
                    totalPath.push(current);
                }

                return totalPath;
            };

            var costEstimate = function(start, goal) {
                return Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
            };

            var closedSet = createNodeSet();

            var openSet = createNodeSet();
            openSet.add(start);

            var cameFrom = createNodeToNodeMap();

            var gScore = createCostMap();
            gScore.set(start, 0);

            var fScore = createCostMap();
            fScore.set(start, costEstimate(start, goal));

            while (openSet.length > 0) {
                var current = openSet.findShortest(fScore);
                if (current.x == goal.x && current.y == goal.y) {
                    return reconstructPath(cameFrom, current);
                }

                openSet.remove(current);
                closedSet.add(current);

                var neighbors = this.getAdjacentPaths(current.x, current.y);
                for (var i = 0; i < neighbors.length; i++) {
                    var neighbor = neighbors[i];
                    if (closedSet.contains(neighbor)) {
                        continue;
                    }

                    var newScore = gScore.get(current) + 1;
                    if (!openSet.contains(neighbor)) {
                        openSet.add(neighbor);
                    } else if (newScore >= gScore.get(neighbor)) {
                        continue;
                    }

                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, newScore);
                    fScore.set(neighbor, newScore + costEstimate(neighbor, goal));
                }
            }

            return [];
        }
    };
};

module.exports = {
    BUFFER_SLOTS,
    MAX_MAP_WIDTH,
    MAX_MAP_HEIGHT,
    SLOTTYPE_EMPTY,
    SLOTTYPE_WALL,
    SLOTTYPE_PLAYERSTART,
    SLOTTYPE_GHOSTSTART,
    SLOTTYPE_GHOSTESCAPE,
    unpackCoords,
    packCoords,
    newMapFromImage,
    createMap
};
