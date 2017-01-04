module.exports = function(container) {

    let canvas = document.createElement("CANVAS");
    container.appendChild(canvas);

    let result = {
        canvas,
        scaleFactor: 20,
        keyMap: {
            left: false,
            right: false,
            up: false,
            down: false
        },
        drawMap(map) {
            let s = this.scaleFactor,
                width = s * map.width,
                height = s * map.height;

            this.canvas.width = width;
            this.canvas.height = height;

            let ctx = this.canvas.getContext("2d");

            ctx.clearRect(0, 0, width, height);

            //var areas = map.getContiguousAreas();
            //for (let area of areas) {
            //    ctx.beginPath();
            //    ctx.moveTo(s*area[0].x, s*area[0].y);
            //    for (let p of area) {
            //        ctx.lineTo(s*p.x, s*p.y);
            //    }
            //    ctx.stroke();
            //}

            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
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
            let s = this.scaleFactor,
                player = state.playerPosition;

            let ctx = this.canvas.getContext("2d");
            ctx.fillStyle = "rgb(0,255,0)";

            ctx.beginPath();
            ctx.arc(s*(player.x+1/2), s*(player.y+1/2), s/2, 0, 2*Math.PI, false);
            ctx.fill();

            ctx.fillStyle = "rgb(255,0,0)";
            state.ghosts.forEach(ghost => {
                let pos = ghost.position;
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
