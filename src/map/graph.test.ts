import {DiagonalGraph, Graph, unsafeCost} from "./graph";

describe('Graph', () => {
    it('treats positive number as a valid neighbor and skips neighbors for 0', () => {
        const graph = new Graph([
            [1, 0],
            [1, 2],
        ]);

        // when
        const zeroZeroNeighbors = graph.neighborsOf({x: 0, y: 0});
        const oneZeroNeighbors = graph.neighborsOf({x: 1, y: 0});
        const zeroOneNeighbors = graph.neighborsOf({x: 0, y: 1});
        const oneOneNeighbors = graph.neighborsOf({x: 1, y: 1});

        // then
        expect(zeroZeroNeighbors.size).toBe(1);
        expect(zeroZeroNeighbors).toContainEqual({x: 0, y: 1});
        // and
        expect(oneZeroNeighbors.size).toBe(0);
        // and
        expect(zeroOneNeighbors.size).toBe(2)
        expect(zeroOneNeighbors).toContainEqual({x: 0, y: 0});
        expect(zeroOneNeighbors).toContainEqual({x: 1, y: 1});
        // and
        expect(oneOneNeighbors.size).toBe(1);
        expect(oneOneNeighbors).toContainEqual({x: 0, y: 1});
    });

    it('is just Graph not DiagonalGraph', () => {
        expect(new Graph([])).toBeInstanceOf(Graph);
        expect(new Graph([])).not.toBeInstanceOf(DiagonalGraph);
    });
});

describe('DiagonalGraph', () => {
    it('treats positive number as a valid neighbor and skips neighbors for 0', () => {
        const graph = new DiagonalGraph([
            [1, 3, 0],
            [1, 2, 9],
            [0, 0, 4],
        ]);

        // when
        const oneOneNeighbors = graph.neighborsOf({x: 1, y: 1});

        // then
        expect(oneOneNeighbors.size).toBe(5);
        expect(oneOneNeighbors).toContainEqual({x: 0, y: 0});
        expect(oneOneNeighbors).toContainEqual({x: 0, y: 1});
        expect(oneOneNeighbors).toContainEqual({x: 0, y: 1});
        expect(oneOneNeighbors).toContainEqual({x: 2, y: 1});
        expect(oneOneNeighbors).toContainEqual({x: 2, y: 2});
    });

    it('is Graph and DiagonalGraph', () => {
        expect(new DiagonalGraph([])).toBeInstanceOf(Graph);
        expect(new DiagonalGraph([])).toBeInstanceOf(DiagonalGraph);
    });
});

describe('unsafeCost', () => {
    it('throws when not GraphPoint', () => {
        expect(() => unsafeCost({x: 0, y: 0}, {x: 1, y: 1})).toThrow();
    });

    it('returns weight ignoring the distance', () => {
        // given
        const simpleGraph = new Graph([[1, 2, 3, 4, 5]]);
        const weight2 = simpleGraph.get({x: 1, y: 0})!;
        const weight4 = simpleGraph.get({x: 3, y: 0})!;

        expect(unsafeCost({x: 0, y: 0}, weight2)).toBe(2);
        expect(unsafeCost({x: 0, y: 0}, weight4)).toBe(4);
        // and
        expect(unsafeCost(weight2, weight4)).toBe(4);
        expect(unsafeCost(weight4, weight2)).toBe(2);
    });

    it('returns weight ignoring the distance for diagonal, using square when needed', () => {
        // given
        const simpleGraph = new DiagonalGraph([
            [9, 1, 0, 0, 0],
            [0, 0, 2, 0, 0],
            [0, 4, 0, 3, 5],
        ]);
        const weight1 = simpleGraph.get({x: 1, y: 0})!;
        const weight2 = simpleGraph.get({x: 2, y: 1})!;
        const weight3 = simpleGraph.get({x: 3, y: 2})!;

        expect(unsafeCost({x: 0, y: 0}, weight1)).toBe(1);
        expect(unsafeCost({x: 1, y: 1}, weight2)).toBe(2);
        expect(unsafeCost({x: 0, y: 2}, weight3)).toBe(3);
        // and diagonal
        expect(unsafeCost(weight1, weight2)).toBe(2 * Math.SQRT2);
        expect(unsafeCost(weight2, weight1)).toBe(Math.SQRT2);
        expect(unsafeCost(weight2, weight3)).toBe(3 * Math.SQRT2);
        expect(unsafeCost(weight3, weight2)).toBe(2 * Math.SQRT2);
        expect(unsafeCost(weight3, weight1)).toBe(Math.SQRT2);
    });
});
