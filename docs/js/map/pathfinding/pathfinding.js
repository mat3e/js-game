import { DiagonalGraph, Graph, unsafeCost } from "./graph";
import { BinaryHeap } from "./heap";
export class Pathfinding {
    #graph;
    #heuristic;
    constructor(map, { allowDiagonal = false, heuristic = heuristicFor(allowDiagonal) } = {}) {
        this.#graph = allowDiagonal ? new DiagonalGraph(map) : new Graph(map);
        this.#heuristic = heuristic;
    }
    find(from, to, { closest: searchingForClosest } = {}) {
        const convertedPoints = new Map();
        const openSet = new BinaryHeap(({ fScore }) => fScore);
        let closestPoint = this.#toPathPoint(this.#graph.get(from), to, convertedPoints);
        openSet.push(closestPoint);
        while (openSet.length > 0) {
            const current = openSet.pop();
            if (current.point.x === to.x && current.point.y === to.y) {
                return this.#reconstructPath(current);
            }
            current.visit();
            this.#graph.neighborsOf(current.point).forEach(neighbor => {
                const neighborPathPoint = this.#toPathPoint(neighbor, to, convertedPoints);
                if (neighborPathPoint.visited) {
                    return;
                }
                if (neighborPathPoint.updatesScoreFrom(current)) {
                    if (searchingForClosest) {
                        closestPoint = PathPoint.closest(closestPoint, neighborPathPoint);
                    }
                    if (openSet.has(neighborPathPoint)) {
                        openSet.update(neighborPathPoint);
                        return;
                    }
                    openSet.push(neighborPathPoint);
                }
            });
        }
        return searchingForClosest ? this.#reconstructPath(closestPoint) : [];
    }
    #reconstructPath(target) {
        const path = [target.point];
        while (target.previous && target.previous.previous) { // skip starting point
            target = target.previous;
            path.push(target.point);
        }
        return path.reverse();
    }
    #toPathPoint(point, target, alreadyConverted) {
        if (alreadyConverted.has(point)) {
            return alreadyConverted.get(point);
        }
        const convertedPoint = new PathPoint(point, this.#heuristic(point, target));
        alreadyConverted.set(point, convertedPoint);
        return convertedPoint;
    }
    toString() {
        return `A* on ${Object.getPrototypeOf(this.#graph).constructor.name} (with ${this.#heuristic.name} heuristic)`;
    }
}
class PathPoint {
    point;
    static closest(first, second) {
        if (first.#h < second.#h || (first.#h === second.#h && first.#gScore < second.#gScore)) {
            return first;
        }
        return second;
    }
    /** Already processed (neighbors checked, etc.). */
    #visited = false;
    /** Cheapest currently known cost from start to this point. */
    #gScore = 0;
    /** Heuristic value (estimated distance to the goal). */
    #h = 0;
    #previous;
    constructor(point, calculatedHeuristic) {
        this.point = point;
        this.#h = calculatedHeuristic;
    }
    visit() {
        this.#visited = true;
    }
    get visited() {
        return this.#visited;
    }
    /**
     * Checks if the provided neighbor results in a better path to this point.
     * If so, updates the score and the reference to the previous point.
     *
     * @param neighbor new point from where we can reach this point
     * @returns true if score was updated, false otherwise
     */
    updatesScoreFrom(neighbor) {
        const gScore = neighbor.#gScore + unsafeCost(neighbor.point, this.point);
        if (this.#gScore && gScore >= this.#gScore) {
            return false;
        }
        this.#gScore = gScore;
        this.#previous = neighbor;
        return true;
    }
    get fScore() {
        return this.#gScore + this.#h;
    }
    get previous() {
        return this.#previous;
    }
}
function heuristicFor(diagonal) {
    if (diagonal) {
        return function octile({ x, y }, goal) {
            const dx = Math.abs(x - goal.x);
            const dy = Math.abs(y - goal.y);
            return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
        };
    }
    return function manhattan({ x, y }, goal) {
        const dx = Math.abs(x - goal.x);
        const dy = Math.abs(y - goal.y);
        return dx + dy;
    };
}
