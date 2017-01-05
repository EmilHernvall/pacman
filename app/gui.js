const SCALEFACTOR = 30;

module.exports = function(container) {

    let canvas = document.createElement("CANVAS");
    container.appendChild(canvas);

    let result = {
        canvas,
        keyMap: {
            left: false,
            right: false,
            up: false,
            down: false
        },
        drawMap(map) {
            let s = SCALEFACTOR,
                width = s * map.width,
                height = s * map.height;

            this.canvas.width = width;
            this.canvas.height = height;

            let ctx = this.canvas.getContext("2d");

            ctx.clearRect(0, 0, width, height);

            let WALL_WIDTH = 2;
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    if (map.isGhostEscape(x,y)) {
                        ctx.fillStyle = "rgb(0,0,255)";
                        ctx.fillRect(s*x, s*y, s, s);
                    } else if (map.isWall(x,y)) {

                        ctx.fillStyle = "#555555";
                        ctx.fillRect(s*x, s*y, s, s);

                        let adj = map.getAdjacentWalls(x,y);
                        ctx.fillStyle = "#cccccc";

                        let blockWidth = s-2*WALL_WIDTH,
                            blockHeight = s-2*WALL_WIDTH;
                        if (adj.left) { blockWidth += WALL_WIDTH; }
                        if (adj.right) { blockWidth += WALL_WIDTH; }
                        if (adj.top) { blockHeight += WALL_WIDTH; }
                        if (adj.bottom) { blockHeight += WALL_WIDTH; }

                        let blockLeft = s*x+WALL_WIDTH,
                            blockTop = s*y+WALL_WIDTH;
                        if (adj.left) { blockLeft -= WALL_WIDTH; }
                        if (adj.top) { blockTop -= WALL_WIDTH; }
                        ctx.fillRect(blockLeft, blockTop, blockWidth, blockHeight);
                    }
                }
            }
        },
        drawState(state) {
            let s = SCALEFACTOR,
                player = state.playerPosition;

            let ctx = this.canvas.getContext("2d");

            // Draw pellets
            ctx.fillStyle = "rgb(255,255,0)";
            state.pellets.forEach(pellet => {
                let x = pellet.x,
                    y = pellet.y;

                ctx.beginPath();
                ctx.arc(s*(x+1/2), s*(y+1/2), s/5, 0, 2*Math.PI, false);
                ctx.fill();
            });

            // Draw super pills
            ctx.fillStyle = "rgb(255,0,255)";
            state.superPills.forEach(pill => {
                let x = pill.x,
                    y = pill.y;

                ctx.beginPath();
                ctx.arc(s*(x+1/2), s*(y+1/2), s/4, 0, 2*Math.PI, false);
                ctx.fill();
            });

            // Draw player
            let playerX = player.px,
                playerY = player.py;
            if (player.ticks + player.den < state.ticks) {
                playerX = player.x;
                playerY = player.y;
            } else {
                let progress = (state.ticks - player.ticks) / player.den,
                    dx = progress * (player.x - player.px),
                    dy = progress * (player.y - player.py);
                playerX += dx;
                playerY += dy;
            }

            if (state.isSuperMode()) {
                ctx.fillStyle = "rgb(0,0,0)";
            } else {
                ctx.fillStyle = "rgb(0,255,0)";
            }
            ctx.beginPath();
            ctx.arc(s*(playerX+1/2), s*(playerY+1/2), s/2.5, 0, 2*Math.PI, false);
            ctx.fill();

            // Draw ghosts
            state.ghosts.forEach(ghost => {
                let x = ghost.px,
                    y = ghost.py;

                if (ghost.ticks + ghost.den < state.ticks) {
                    x = ghost.x;
                    y = ghost.y;
                } else {
                    let progress = (state.ticks - ghost.ticks) / ghost.den,
                        dx = progress * (ghost.x - ghost.px),
                        dy = progress * (ghost.y - ghost.py);
                    x += dx;
                    y += dy;
                }

                if (ghost.returnToCage) {
                    ctx.fillStyle = "rgb(255,200,200)";
                } else {
                    ctx.fillStyle = "rgb(255,0,0)";
                }

                ctx.beginPath();
                ctx.arc(s*(x+1/2), s*(y+1/2), s/2.5, 0, 2*Math.PI, false);
                ctx.fill();
            });
        },
        drawGameOver(state) {
            let ctx = this.canvas.getContext("2d");
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 100, 100, 1)";
            ctx.font = "48px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("GAME OVER", canvas.width/2, 1*canvas.height/3);

            ctx.font = "20px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.fillText("Your score was: " + state.score, canvas.width/2, canvas.height/2);

            ctx.font = "24px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(100, 255, 100, 1)";
            ctx.fillText("Click to Retry", canvas.width/2, 2*canvas.height/3);
        }
    };

    canvas.addEventListener("click", function() {
        if (result.onClick) {
            result.onClick();
        }
    });

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
