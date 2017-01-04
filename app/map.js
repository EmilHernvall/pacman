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

let packCoords = function(x,y) {
    return ((x & COORDINATE_BIT_MASK) << BITS_PER_COORDINATE) |
           (y & COORDINATE_BIT_MASK);
};

let unpackCoords = function(c) {
    let x = (c >> BITS_PER_COORDINATE) & COORDINATE_BIT_MASK,
        y = c & COORDINATE_BIT_MASK;

    return { x, y };
};

let createNodeSet = function() {
    return {
        nodes: {},
        length: 0,
        add(node) {
            let c = packCoords(node.x, node.y);
            this.length++;
            this.nodes[c] = true;
        },
        contains(node) {
            let c = packCoords(node.x, node.y);
            return this.nodes[c] === true;
        },
        remove(node) {
            let c = packCoords(node.x, node.y);
            delete this.nodes[c];
            this.length--;
        },
        findShortest(scores) {
            let bestNode = null,
                minScore = Number.POSITIVE_INFINITY;
            for (let idx in this.nodes) {
                let node = this.nodes[idx],
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

let createCostMap = function() {
    return {
        nodes: {},
        set(node, cost) {
            let c = packCoords(node.x, node.y);
            this.nodes[c] = cost;
        },
        get(node) {
            let c = packCoords(node.x, node.y);
            if (typeof this.nodes[c] === "undefined") {
                return Number.POSITIVE_INFINITY;
            }

            return this.nodes[c];
        }
    };
};

let createNodeToNodeMap = function() {
    return {
        nodes: {},
        set(node, target) {
            let c = packCoords(node.x, node.y);
            this.nodes[c] = target;
        },
        get(node) {
            let c = packCoords(node.x, node.y);
            return this.nodes[c];
        },
        contains(node) {
            let c = packCoords(node.x, node.y);
            return typeof this.nodes[c] !== "undefined";
        }
    };
};

let newMapFromImage = function(imageOfMap) {
    let width = imageOfMap.width,
        height = imageOfMap.height;

    let localCanvas = document.createElement("CANVAS");
    localCanvas.width = width;
    localCanvas.height = height;

    let ctx = localCanvas.getContext("2d");
    ctx.drawImage(imageOfMap, 0, 0, width, height);

    let data = ctx.getImageData(0, 0, width, height).data;
    let mapData = new Uint8Array(BUFFER_SLOTS);
    for (let idx = 0; idx < data.length; idx += 4) {
        let properIdx = idx / 4,
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

let createMap = function(width, height, buffer) {
    return {
        width,
        height,
        buffer,
        getAdjacentPaths(x, y) {
            let paths = [];

            paths.push({ x: x, y: y-1 }); // Above
            paths.push({ x: x-1, y: y }); // Left
            paths.push({ x: x+1, y: y }); // Right
            paths.push({ x: x, y: y+1 }); // Below

            return paths.filter(p => !this.isWall(p.x, p.y) ||
                                     this.isGhostEscape(p.x, p.y));
        },
        getContiguousAreas() {
            let scanFromBlock = start => {
                let candidates = [start],
                    blocks = [],
                    visited = createNodeSet();
                while (candidates.length > 0) {
                    let cur = candidates.pop(),
                        x = cur.x,
                        y = cur.y;

                    visited.add(cur);
                    blocks.push(cur);

                    candidates.push({ x: x, y: y-1 }); // Above
                    candidates.push({ x: x-1, y: y }); // Left
                    candidates.push({ x: x+1, y: y }); // Right
                    candidates.push({ x: x, y: y+1 }); // Below

                    candidates = candidates.filter(p => this.isWall(p.x, p.y) &&
                                                        !visited.contains(p));
                }

                return blocks;
            };

            let areas = [],
                usedBlocks = createNodeSet();
            for (let y = 0; y < this.width; y++) {
                for (let x = 0; x < this.height; x++) {
                    if (!this.isWall(x,y)) {
                        continue;
                    }

                    let p = {x,y};

                    if (usedBlocks.contains(p)) {
                        continue;
                    }

                    var area = scanFromBlock(p);
                    area.forEach(block => {
                        usedBlocks.add(block);
                    });
                    areas.push(area);
                }
            }

            return areas;
        },
        isWall(x,y) {
            let c = this.buffer[packCoords(x,y)];
            return c === SLOTTYPE_WALL || c == SLOTTYPE_GHOSTESCAPE;
        },
        isGhostEscape(x,y) {
            let c = this.buffer[packCoords(x,y)];
            return c == SLOTTYPE_GHOSTESCAPE;
        },
        getPlayerStart() {
            for (let i = 0; i < buffer.length; i++) {
                let c = buffer[i];
                if (c == SLOTTYPE_PLAYERSTART) {
                    return unpackCoords(i);
                }
            }

            return;
        },
        getGhostStarts() {
            let ghostStarts = [];
            for (let i = 0; i < buffer.length; i++) {
                let c = buffer[i];
                if (c == SLOTTYPE_GHOSTSTART) {
                    ghostStarts.push(unpackCoords(i));
                }
            }

            return ghostStarts;
        },
        findClosestPath(start, goal) {
            let reconstructPath = function(cameFrom, current) {
                let totalPath = [current];
                while (cameFrom.contains(current)) {
                    current = cameFrom.get(current);
                    totalPath.push(current);
                }

                return totalPath;
            };

            let costEstimate = function(start, goal) {
                return Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
            };

            let closedSet = createNodeSet();

            let openSet = createNodeSet();
            openSet.add(start);

            let cameFrom = createNodeToNodeMap();

            let gScore = createCostMap();
            gScore.set(start, 0);

            let fScore = createCostMap();
            fScore.set(start, costEstimate(start, goal));

            while (openSet.length > 0) {
                let current = openSet.findShortest(fScore);
                if (current.x == goal.x && current.y == goal.y) {
                    return reconstructPath(cameFrom, current);
                }

                openSet.remove(current);
                closedSet.add(current);

                let neighbors = this.getAdjacentPaths(current.x, current.y);
                for (let i = 0; i < neighbors.length; i++) {
                    let neighbor = neighbors[i];
                    if (closedSet.contains(neighbor)) {
                        continue;
                    }

                    let newScore = gScore.get(current) + 1;
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
