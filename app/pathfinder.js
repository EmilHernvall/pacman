let mapModule = require("./map"),
    packCoords = mapModule.packCoords,
    unpackCoords = mapModule.unpackCoords;

const NODE_OPEN = 1,
      NODE_CLOSED = 2;

let createNodeMap = function() {
    return {
        nodes: {},
        set(node, value) {
            let c = packCoords(node.x, node.y);
            this.nodes[c] = value;
        },
        get(node) {
            let c = packCoords(node.x, node.y);
            return this.nodes[c];
        },
        getDefault(node, d) {
            let c = packCoords(node.x, node.y);
            let r = this.nodes[c];
            return typeof r != "undefined" ? r : d;
        },
        contains(node) {
            let c = packCoords(node.x, node.y);
            return typeof this.nodes[c] !== "undefined";
        }
    };
};

let reconstructPath = function(cameFrom, current) {
    let totalPath = [current];
    while (cameFrom.contains(current)) {
        current = cameFrom.get(current);
        totalPath.push(current);
    }

    // remove start point
    totalPath.pop();

    return totalPath;
};

let costEstimate = function(start, goal) {
    return Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
};

let findShortest = function(nodeStateMap, scores) {
    let bestNode = null,
        minScore = Number.POSITIVE_INFINITY;
    for (let idx in nodeStateMap.nodes) {
        let value = nodeStateMap.nodes[idx],
            score = scores.get(unpackCoords(idx));

        if (value !== NODE_OPEN) {
            continue;
        }

        if (score < minScore) {
            bestNode = idx;
            minScore = score;
        }
    }

    return unpackCoords(bestNode);
};

let nodesRemaining = function(nodeStateMap) {
    return Object.values(nodeStateMap.nodes).filter(x => x === NODE_OPEN).length;
};

let findClosestPath = function(map, start, goal) {
    let nodeStateMap = createNodeMap();
    nodeStateMap.set(start, NODE_OPEN);

    let cameFrom = createNodeMap();

    let gScore = createNodeMap();
    gScore.set(start, 0);

    let fScore = createNodeMap();
    fScore.set(start, costEstimate(start, goal));

    while (nodesRemaining(nodeStateMap)) {
        let current = findShortest(nodeStateMap, fScore);
        if (current.x == goal.x && current.y == goal.y) {
            return reconstructPath(cameFrom, current);
        }

        nodeStateMap.set(current, NODE_CLOSED);

        let neighbors = map.getAdjacentPaths(current.x, current.y);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            if (nodeStateMap.contains(neighbor)) {
                continue;
            }

            let newScore = gScore.getDefault(current, Number.POSITIVE_INFINITY) + 1;
            if (!nodeStateMap.contains(neighbor)) {
                nodeStateMap.set(neighbor, NODE_OPEN);
            } else if (newScore >= gScore.getDefault(neighbor, Number.POSITIVE_INFINITY)) {
                continue;
            }

            cameFrom.set(neighbor, current);
            gScore.set(neighbor, newScore);
            fScore.set(neighbor, newScore + costEstimate(neighbor, goal));
        }
    }

    return [];
}

module.exports = {
    findClosestPath
};
