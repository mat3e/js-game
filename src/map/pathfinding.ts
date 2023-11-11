import {DiagonalGraph, Graph, Point, unsafeCost} from "./graph";
import {BinaryHeap} from "./heap";

type Options = {
    allowDiagonal?: boolean;
    heuristic?: Heuristic;
}

export class Pathfinding {
    #graph: Graph;
    #heuristic: Heuristic;

    constructor(map: number[][], {
        allowDiagonal = false,
        heuristic = heuristicFor(allowDiagonal)
    }: Options = {}) {
        this.#graph = allowDiagonal ? new DiagonalGraph(map) : new Graph(map);
        this.#heuristic = heuristic;
    }

    find(from: Point, to: Point): Point[] {
        const convertedPoints: Map<Point, PathPoint> = new Map();
        const openSet = new BinaryHeap<PathPoint>(({fScore}) => fScore);
        openSet.push(new PathPoint(from, this.#heuristic(from, to)));
        while (openSet.length > 0) {
            const current = openSet.pop()!;
            if (current.point.x === to.x && current.point.y === to.y) {
                return this.#reconstructPath(current);
            }
            current.visit();
            this.#graph.neighborsOf(current.point).forEach(neighbor => {
                const neighborPathPoint = this.#convertPoint(neighbor, convertedPoints);
                if (neighborPathPoint.visited) {
                    return;
                }
                if (neighborPathPoint.updatedScoreFrom(current)) {
                    if (openSet.has(neighborPathPoint)) {
                        openSet.update(neighborPathPoint);
                        return;
                    }
                    openSet.push(neighborPathPoint);
                }
            });
        }
        return [];
    }

    #reconstructPath(target: PathPoint): Point[] {
        const path = [target.point];
        while (target.parent && target.parent.parent) { // skip starting point
            target = target.parent;
            path.unshift(target.point);
        }
        return path;
    }

    #convertPoint(point: Point, alreadyConverted: Map<Point, PathPoint>): PathPoint {
        if (alreadyConverted.has(point)) {
            return alreadyConverted.get(point)!;
        }
        const convertedPoint = new PathPoint(point, this.#heuristic(point, point));
        alreadyConverted.set(point, convertedPoint);
        return convertedPoint;
    }

    toString() {
        return `A* on ${Object.getPrototypeOf(this.#graph).constructor.name} (with ${this.#heuristic.name} heuristic)`;
    }
}

class PathPoint {
    /** Already processed with neighbors. */
    #visited: boolean = false;
    /** Cheapest currently known cost from start to this point. */
    #gScore: number = 0;
    /** Heuristic value. */
    #h: number = 0;
    #parent?: PathPoint;

    constructor(readonly point: Point, calculatedHeuristic: number) {
        this.#h = calculatedHeuristic;
    }

    visit() {
        this.#visited = true;
    }

    get visited(): boolean {
        return this.#visited;
    }

    updatedScoreFrom(neighbor: PathPoint): boolean {
        const gScore = neighbor.#gScore + unsafeCost(neighbor.point, this.point);
        if (this.#gScore && gScore >= this.#gScore) {
            return false;
        }
        this.#gScore = gScore;
        this.#parent = neighbor;
        return true;
    }

    get fScore(): number {
        return this.#gScore + this.#h;
    }

    get parent(): PathPoint | undefined {
        return this.#parent;
    }
}

/**
 * Estimates the cost to reach goal from node.
 *
 * @see {@link https://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html}
 */
type Heuristic = {
    (node: Point, goal: Point): number;
}

function heuristicFor(diagonal: boolean): Heuristic {
    if (diagonal) {
        return function octile({x, y}, goal) {
            const dx = Math.abs(x - goal.x);
            const dy = Math.abs(y - goal.y);
            return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
        }
    }
    return function manhattan({x, y}, goal) {
        const dx = Math.abs(x - goal.x);
        const dy = Math.abs(y - goal.y);
        return dx + dy;
    }
}
