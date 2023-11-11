import {Pathfinding} from './pathfinding';
import {Point} from "./graph";

const {arrayContaining, objectContaining} = expect;

describe('Pathfinding', () => {
    it('is created from array without diagonal support by default', () => {
        // given
        const pathfinding = new Pathfinding([]);

        expect(pathfinding).toBeDefined();
        // and
        expect(pathfinding.toString()).toMatch('Graph');
        // and
        expect(pathfinding.toString()).toMatch('manhattan');
    });

    it('is created from array and options as diagonal', () => {
        // given
        const pathfinding = new Pathfinding([], {allowDiagonal: true});

        expect(pathfinding).toBeDefined();
        // and
        expect(pathfinding.toString()).toMatch('DiagonalGraph');
        // and
        expect(pathfinding.toString()).toMatch('octile');
    });

    it.each([
        [[1]],
        [[1, 2]],
        [[1, 2, 3, 4]],
    ])('supports basic horizontal paths (%p)', (source: number[]) => {
        // given
        const pathfinding = new Pathfinding([source]);
        const [, ...expected] = source.map(({}, x) => ({x, y: 0}));

        // when
        const result = pathfinding.find({x: 0, y: 0}, {x: source.length - 1, y: 0});

        // then
        expect(result).toEqual(arrayContaining<Point>(expected.map(({x, y}) => objectContaining({x, y}))));
    });

    it.each([
        [[
            [1],
        ]],
        [[
            [1, 0],
            [1, 0],
        ]],
        [[
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
        ]]
    ])('supports basic vertical paths', (source: number[][]) => {
        // given
        const pathfinding = new Pathfinding(source);
        const [, ...expected] = source.map(({}, y) => ({x: 0, y}));

        // when
        const result = pathfinding.find({x: 0, y: 0}, {x: 0, y: source.length - 1});

        // then
        expect(result).toEqual(arrayContaining<Point>(expected.map(({x, y}) => objectContaining({x, y}))));
    });

    it.each`
    graph               | expectedPath
    ${[ //              |
        [1, 1], //      |
        [2, 1], //      |
    ]}                  | ${[{x: 1, y: 0}, {x: 1, y: 1}]}
        ${[ //          |
        [1, 2], //      |
        [1, 1], //      |
    ]}                  | ${[{x: 0, y: 1}, {x: 1, y: 1}]}
    `('supports basic weighting (%p)', ({graph, expectedPath}: { graph: number[][], expectedPath: Point[] }) => {
        // given
        const pathfinding = new Pathfinding(graph);

        // when
        const result = pathfinding.find({x: 0, y: 0}, {x: 1, y: 1});

        // then
        expect(result).toHaveLength(2);
        expect(result).toEqual(arrayContaining<Point>(expectedPath.map(({x, y}) => objectContaining({x, y}))));
    });

    it('works with complex paths', () => {
        // given
        const pathfinding = new Pathfinding([
            [1, 1, 1, 1],
            [0, 1, 1, 0],
            [0, 0, 1, 1],
        ]);

        // when
        const result = pathfinding.find({x: 0, y: 0}, {x: 3, y: 2});

        // then
        expect(result).toHaveLength(5);
        expect(result).toEqual(arrayContaining<Point>([
            objectContaining({x: 1, y: 0}),
            objectContaining({x: 1, y: 1}),
            objectContaining({x: 2, y: 1}),
            objectContaining({x: 2, y: 2}),
            objectContaining({x: 3, y: 2}),
        ]));
    });

    it('works with complex paths with diagonal support', () => {
        // given
        const pathfinding = new Pathfinding([
            [1, 1, 1, 1],
            [0, 1, 1, 0],
            [0, 0, 1, 1],
        ], {allowDiagonal: true});

        // when
        const result = pathfinding.find({x: 0, y: 0}, {x: 3, y: 2});

        // then
        expect(result).toHaveLength(3);
        expect(result).toEqual(arrayContaining<Point>([
            objectContaining({x: 1, y: 0}),
            objectContaining({x: 2, y: 1}),
            objectContaining({x: 3, y: 2}),
        ]));
    });

    it('supports multiple runs', () => {
        // given
        const pathfinding = new Pathfinding([
            [1, 1, 0, 1],
            [0, 1, 1, 0],
            [0, 0, 1, 1],
        ]);

        // when
        const result1 = pathfinding.find({x: 0, y: 0}, {x: 3, y: 2});
        const result2 = pathfinding.find({x: 0, y: 0}, {x: 3, y: 2});
        const result3 = pathfinding.find({x: 3, y: 2}, {x: 0, y: 0});

        // then
        expect(result1).toEqual(arrayContaining<Point>([
            objectContaining({x: 1, y: 0}),
            objectContaining({x: 1, y: 1}),
            objectContaining({x: 2, y: 1}),
            objectContaining({x: 2, y: 2}),
            objectContaining({x: 3, y: 2}),
        ]));
        expect(result1).toEqual(result2);
        expect(result3).toEqual(arrayContaining<Point>([
            objectContaining({x: 2, y: 2}),
            objectContaining({x: 2, y: 1}),
            objectContaining({x: 1, y: 1}),
            objectContaining({x: 1, y: 0}),
            objectContaining({x: 0, y: 0}),
        ]));
    });
});
