export class Graph {
    #adjacency = new Map();
    #originalPoints = new Map();
    constructor(grid) {
        grid.forEach((row, y) => row.forEach((value, x) => {
            if (value > 0) {
                const point = this.createPoint(x, y, value);
                const pointStr = point.toString();
                this.#originalPoints.set(pointStr, point);
                this.#adjacency.set(pointStr, new Set());
                this.#addConnections(point);
            }
        }));
    }
    get(point) {
        return this.#originalPoints.get(toString(point));
    }
    neighborsOf(point) {
        return new Set([...this.#adjacency.get(toString(point)) ?? []]
            .map(neighbor => this.#originalPoints.get(neighbor)));
    }
    createPoint(x, y, weight) {
        return new FourNeighborsPoint(x, y, weight);
    }
    #addConnections(point) {
        point.potentialNeighbors.forEach(neighbor => {
            const neighborStr = neighbor.toString();
            const pointStr = point.toString();
            if (this.#adjacency.has(neighborStr)) {
                this.#adjacency.get(pointStr).add(neighborStr);
                this.#adjacency.get(neighborStr).add(pointStr);
            }
        });
    }
}
export class DiagonalGraph extends Graph {
    createPoint(x, y, weight) {
        return new DiagonalNeighborsPoint(x, y, weight);
    }
}
/**
 * Should be more restrict, validate and use better cost calculation, but we have a full control over calling it
 * and optimize toward performance.
 *
 * Should be fine when calling it just for the current node and its corresponding neighbors.
 */
export function unsafeCost(from, to) {
    return to.costFrom(from);
}
class GraphPoint {
    x;
    y;
    #weight;
    constructor(x, y, weight = 1) {
        this.x = x;
        this.y = y;
        this.#weight = weight;
    }
    // should multiply by x and y differences
    costFrom({}) {
        return this.#weight;
    }
    toString() {
        return toString(this);
    }
}
function toString({ x, y }) {
    return `${x}x${y}`;
}
class FourNeighborsPoint extends GraphPoint {
    get potentialNeighbors() {
        return new Set([
            new FourNeighborsPoint(this.x - 1, this.y),
            new FourNeighborsPoint(this.x + 1, this.y),
            new FourNeighborsPoint(this.x, this.y - 1),
            new FourNeighborsPoint(this.x, this.y + 1)
        ]);
    }
}
class DiagonalNeighborsPoint extends GraphPoint {
    get potentialNeighbors() {
        return new Set([
            new DiagonalNeighborsPoint(this.x - 1, this.y - 1),
            new DiagonalNeighborsPoint(this.x, this.y - 1),
            new DiagonalNeighborsPoint(this.x + 1, this.y - 1),
            new DiagonalNeighborsPoint(this.x - 1, this.y),
            new DiagonalNeighborsPoint(this.x + 1, this.y),
            new DiagonalNeighborsPoint(this.x - 1, this.y + 1),
            new DiagonalNeighborsPoint(this.x, this.y + 1),
            new DiagonalNeighborsPoint(this.x + 1, this.y + 1),
        ]);
    }
    // should multiply by x and y differences
    costFrom(target) {
        const weight = super.costFrom(target);
        if (target.x !== this.x && target.y !== this.y) {
            return weight * Math.SQRT2;
        }
        return weight;
    }
}
