describe("Our map representation should", function() {
    var map = require("../../app/map");

    it("return the same set of coordinates that was packed into an integer when unpacking them", function() {
        var coord = { x: 5, y: 7 },
            coord2 = map.unpackCoords(map.packCoords(coord.x, coord.y));

        expect(coord2.x).toBe(coord.x);
        expect(coord2.y).toBe(coord.y);
    });

    it("given a buffer of zeroes yield a map full of walls", function() {
        var buffer = new Uint8Array(map.BUFFER_SLOTS),
            fullMap = map.createMap(map.MAX_MAP_WIDTH, map.MAX_MAP_HEIGHT, buffer);

        var empty = 0;
        for (var x = 0; x < map.MAX_MAP_WIDTH; x++) {
            for (var y = 0; y < map.MAX_MAP_HEIGHT; y++) {
                if (fullMap.isWall(x,y)) {
                    empty++;
                }
            }
        }

        expect(empty).toEqual(0);
    });

    it("given a buffer of ones yield a map empty of walls", function() {
        var buffer = new Uint8Array(map.BUFFER_SLOTS);

        for (var i = 0; i < buffer.length; i++) {
            buffer[i] = 1;
        }

        var emptyMap = map.createMap(map.MAX_MAP_WIDTH, map.MAX_MAP_HEIGHT, buffer);

        var walls = 0;
        for (var x = 0; x < map.MAX_MAP_WIDTH; x++) {
            for (var y = 0; y < map.MAX_MAP_HEIGHT; y++) {
                if (!emptyMap.isWall(x,y)) {
                    walls++;
                }
            }
        }

        expect(walls).toBe(0);
    });

    it("given a buffer with a single point set to wall, show that point as a wall", function() {
        var buffer = new Uint8Array(map.BUFFER_SLOTS);
        buffer[0] = map.SLOTTYPE_WALL;
        var gameMap = map.createMap(map.MAX_MAP_WIDTH, map.MAX_MAP_HEIGHT, buffer);
        expect(gameMap.isWall(0, 0)).toBe(true);
    });

    it("given a buffer with a single point set to player start, show that point as empty", function() {
        var buffer = new Uint8Array(map.BUFFER_SLOTS);
        buffer[0] = map.SLOTTYPE_PLAYERSTART;
        var gameMap = map.createMap(map.MAX_MAP_WIDTH, map.MAX_MAP_HEIGHT, buffer);
        expect(gameMap.isWall(0, 0)).toBe(false);
    });

    it("given a buffer with a single point set to ghost start, show that point as empty", function() {
        var buffer = new Uint8Array(map.BUFFER_SLOTS);
        buffer[0] = map.SLOTTYPE_GHOSTSTART;
        var gameMap = map.createMap(map.MAX_MAP_WIDTH, map.MAX_MAP_HEIGHT, buffer);
        expect(gameMap.isWall(0, 0)).toBe(false);
    });

    it("given a buffer with a single point set to ghost escape, show that point as a wall", function() {
        var buffer = new Uint8Array(map.BUFFER_SLOTS);
        buffer[0] = map.SLOTTYPE_GHOSTESCAPE;
        var gameMap = map.createMap(map.MAX_MAP_WIDTH, map.MAX_MAP_HEIGHT, buffer);
        expect(gameMap.isWall(0, 0)).toBe(true);
    });
});
