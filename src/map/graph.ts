export type Point = {
    x: number;
    y: number;
}

export class Graph {
    #adjacency: Map<string, Set<string>> = new Map();
    #originalPoints: Map<string, GraphPoint> = new Map();

    constructor(grid: number[][]) {
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

    neighborsOf(point: Point): Set<Point> {
        return new Set([...this.#adjacency.get(toString(point)) ?? []]
            .map(neighbor => this.#originalPoints.get(neighbor)!));
    }

    protected createPoint(x: number, y: number, weight: number): GraphPoint {
        return new FourNeighborsPoint(x, y, weight);
    }

    #addConnections(point: GraphPoint) {
        point.potentialNeighbors.forEach(neighbor => {
            const neighborStr = neighbor.toString();
            const pointStr = point.toString();
            if (this.#adjacency.has(neighborStr)) {
                this.#adjacency.get(pointStr)!.add(neighborStr);
                this.#adjacency.get(neighborStr)!.add(pointStr);
            }
        });
    }
}

export class DiagonalGraph extends Graph {
    protected override createPoint(x: number, y: number, weight: number): GraphPoint {
        return new DiagonalNeighborsPoint(x, y, weight);
    }
}

/**
 * Should be more restrict, validate and use better cost calculation, but we have a full control over calling it
 * and optimize toward performance.
 *
 * Should be fine when calling it just for the current node and its corresponding neighbors.
 */
export function unsafeCost(from: Point, to: Point): number {
    return (to as GraphPoint).costFrom(from);
}

abstract class GraphPoint implements Point {
    readonly #weight: number;

    constructor(readonly x: number, readonly y: number, weight: number = 1) {
        this.#weight = weight;
    }

    abstract get potentialNeighbors(): Set<Point>;

    // should multiply by x and y differences
    costFrom({}: Point): number {
        return this.#weight;
    }

    toString(): string {
        return toString(this);
    }
}

function toString({x, y}: Point): string {
    return `${x}x${y}`;
}

class FourNeighborsPoint extends GraphPoint {
    override get potentialNeighbors(): Set<Point> {
        return new Set([
            new FourNeighborsPoint(this.x - 1, this.y),
            new FourNeighborsPoint(this.x + 1, this.y),
            new FourNeighborsPoint(this.x, this.y - 1),
            new FourNeighborsPoint(this.x, this.y + 1)
        ]);
    }
}

class DiagonalNeighborsPoint extends GraphPoint {
    override get potentialNeighbors(): Set<Point> {
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
    override costFrom(target: Point): number {
        const weight = super.costFrom(target);
        if (target.x !== this.x && target.y !== this.y) {
            return weight * Math.SQRT2;
        }
        return weight;
    }
}
