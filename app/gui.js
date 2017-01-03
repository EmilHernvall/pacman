module.exports = function(container) {

    var canvas = document.createElement("CANVAS");
    container.append(canvas);

    var result = {
        canvas,
        scaleFactor: 20,
        keyMap: {
            left: false,
            right: false,
            up: false,
            down: false
        },
        drawMap(map) {
            var s = this.scaleFactor,
                width = s * map.width,
                height = s * map.height;

            this.canvas.width = width;
            this.canvas.height = height;

            var ctx = this.canvas.getContext("2d");
            ctx.clearRect(0, 0, width, height);
            for (var y = 0; y < map.height; y++) {
                for (var x = 0; x < map.width; x++) {
                    if (map.isGhostEscape(x,y)) {
                        ctx.fillStyle = "rgb(0,0,255)";
                        ctx.fillRect(s*x, s*y, s, s);
                    } else if (map.isWall(x,y)) {
                        ctx.fillStyle = "rgb(0,0,0)";
                        ctx.fillRect(s*x, s*y, s, s);
                    }
                }
            }
        },
        drawState(state) {
            var s = this.scaleFactor,
                player = state.playerPosition;

            var ctx = this.canvas.getContext("2d");
            ctx.fillStyle = "rgb(0,255,0)";

            ctx.beginPath();
            ctx.arc(s*(player.x+1/2), s*(player.y+1/2), s/2, 0, 2*Math.PI, false);
            ctx.fill();

            ctx.fillStyle = "rgb(255,0,0)";
            state.ghosts.forEach(ghost => {
                var pos = ghost.position;
                ctx.beginPath();
                ctx.arc(s*(pos.x+1/2), s*(pos.y+1/2), s/2, 0, 2*Math.PI, false);
                ctx.fill();
            });
        }
    };

    window.addEventListener("keydown", function(e) {
        switch (e.keyCode) {
            case 37: this.keyMap.left = true; break;
            case 38: this.keyMap.up = true; break;
            case 39: this.keyMap.right = true; break;
            case 40: this.keyMap.down = true; break;
        }
    }.bind(result));

    window.addEventListener("keyup", function(e) {
        switch (e.keyCode) {
            case 37: this.keyMap.left = false; break;
            case 38: this.keyMap.up = false; break;
            case 39: this.keyMap.right = false; break;
            case 40: this.keyMap.down = false; break;
        }
    }.bind(result));

    return result;
};
