const BITS_PER_COORDINATE = 5,
      MAX_MAP_WIDTH = 1 << 5,
      MAX_MAP_HEIGHT = 1 << 5,
      BUFFER_SLOTS = (1 << (2*BITS_PER_COORDINATE)),
      COORDINATE_BIT_MASK = (1 << 5) - 1;

const SLOTTYPE_EMPTY = 0,
      SLOTTYPE_WALL = 1,
      SLOTTYPE_PLAYERSTART = 2,
      SLOTTYPE_GHOSTSTART = 3,
      SLOTTYPE_GHOSTESCAPE = 4,
      SLOTTYPE_PELLET = 5,
      SLOTTYPE_SUPERPILL = 6;

let packCoords = function(x,y) {
    return ((x & COORDINATE_BIT_MASK) << BITS_PER_COORDINATE) |
           (y & COORDINATE_BIT_MASK);
};

let unpackCoords = function(c) {
    let x = (c >> BITS_PER_COORDINATE) & COORDINATE_BIT_MASK,
        y = c & COORDINATE_BIT_MASK;

    return { x, y };
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

        if (c === 0xFFFFFF) {
            mapData[newIdx] = SLOTTYPE_EMPTY;
        } else if (c === 0xFF0000) {
            mapData[newIdx] = SLOTTYPE_GHOSTSTART;
        } else if (c === 0x00FF00) {
            mapData[newIdx] = SLOTTYPE_PLAYERSTART;
        } else if (c === 0x0000FF) {
            mapData[newIdx] = SLOTTYPE_GHOSTESCAPE;
        } else if (c === 0xFFFF00) {
            mapData[newIdx] = SLOTTYPE_PELLET;
        } else if (c === 0xFF00FF) {
            mapData[newIdx] = SLOTTYPE_SUPERPILL;
        } else {
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
        getAdjacentWalls(x, y) {
            let adjacent = {};

            adjacent.top = this.isWall(x, y-1);
            adjacent.left = this.isWall(x-1, y);
            adjacent.right = this.isWall(x+1, y);
            adjacent.bottom = this.isWall(x, y+1);

            return adjacent;
        },
        isWall(x,y) {
            let c = this.buffer[packCoords(x,y)];
            return c === SLOTTYPE_WALL || c == SLOTTYPE_GHOSTESCAPE;
        },
        isGhostEscape(x,y) {
            let c = this.buffer[packCoords(x,y)];
            return c == SLOTTYPE_GHOSTESCAPE;
        },
        getBlocksBySlotType(type) {
            let result  = [];
            for (let i = 0; i < buffer.length; i++) {
                let c = buffer[i];
                if (c == type) {
                    result.push(unpackCoords(i));
                }
            }

            return result;
        },
        getPlayerStart() {
            return this.getBlocksBySlotType(SLOTTYPE_PLAYERSTART)[0];
        },
        getGhostStarts() {
            return this.getBlocksBySlotType(SLOTTYPE_GHOSTSTART);
        },
        getPellets() {
            return this.getBlocksBySlotType(SLOTTYPE_PELLET);
        },
        getSuperPills() {
            return this.getBlocksBySlotType(SLOTTYPE_SUPERPILL);
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
