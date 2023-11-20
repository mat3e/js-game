import {Point} from "./pathfinding/index";
import {interacting, moving} from "./rendering";

describe('Interacting', () => {
    describe('contains', () => {
        it('takes parent dimensions by default', () => {
            // given
            const interactingObject = new (interacting())({
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                inParent: {
                    width: 10,
                    height: 10
                }
            });

            // when
            const result = interactingObject.contains(3, 3);
            const result2 = interactingObject.contains(10, 10);

            // then
            expect(result).toBe(true);
            expect(result2).toBe(false);
        });

        it('check just exact dimensions in strict mode', () => {
            // given
            const interactingObject = new (interacting())({
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                inParent: {
                    width: 10,
                    height: 10
                }
            });

            // when (offset 4 left and 4 top)
            const result = interactingObject.contains(3, 3, {strict: true});
            const result2 = interactingObject.contains(4, 4, {strict: true});

            // then
            expect(result).toBe(false);
            expect(result2).toBe(true);
        });
    });

    describe('collidesWith', () => {
        /*
        (0,0)*---------*(10,0)
             |  (8,1)*-|-------*(18,1)
             |       | |       |
        (0,3)*---------*(10,3) |
                     |         |
                (8,5)*---------*(18,5)
         */
        it.each`
        x     | y   
        ${0}  | ${0}
        ${10} | ${0}
        ${0}  | ${3}
        ${10} | ${3}
        `('recognizes collision for each corner (top-left: $x x $y)', ({x, y}) => {
            // given
            const first = new (interacting())({x, y, width: 10, height: 3, inParent: {width: 100, height: 100}});
            const second = new (interacting())({x: 8, y: 1, width: 10, height: 4});

            // when
            const result = first.collidesWith(second);

            // then
            expect(result).toBe(true);
        });

        /*
        (0,0)*-----------------------------*(30,0)
             |  (8,1)*---------*(18,1)     |
             |       |         |           |
        (0,3)*-----------------------------*(30,3)
                     |         |
                (8,5)*---------*(18,5)
         */
        it('recognizes non-corner collision looking from the first object perspective', () => {
            // given
            const first = new (interacting())({x: 0, y: 0, width: 30, height: 3});
            const second = new (interacting())({x: 8, y: 1, width: 10, height: 4});

            // when
            const result = first.collidesWith(second);

            // then
            expect(result).toBe(true);
        });

        it('recognizes no collision', () => {
            // given
            const first = new (interacting())({x: 0, y: 0, width: 10, height: 10});
            const second = new (interacting())({x: 20, y: 20, width: 10, height: 10});

            // when
            const result = first.collidesWith(second);

            // then
            expect(result).toBe(false);
        });
    });
});

describe('Moving', () => {
    describe('currentDirection', () => {
        it('is south by default', () => {
            // given
            const tested = new (moving())({x: 0, y: 0});

            expect(tested.currentDirection).toBe('S');
        });

        it('takes from constructor', () => {
            // given
            const tested = new (moving())({x: 0, y: 0, direction: 'E'});

            expect(tested.currentDirection).toBe('E');
        });
    });

    describe('lookAt', () => {
        it.each`
        point           | expectedDirection
        ${{x: 2, y: 1}} | ${'E'}
        ${{x: 0, y: 1}} | ${'W'}
        ${{x: 1, y: 0}} | ${'N'}
        ${{x: 1, y: 2}} | ${'S'}
        ${{x: 2, y: 2}} | ${'E'}
        ${{x: 2, y: 0}} | ${'E'}
        ${{x: 0, y: 0}} | ${'W'}
        ${{x: 0, y: 2}} | ${'W'}
        `('rotates to point $point => $expectedDirection', ({point, expectedDirection}: {
            point: Point,
            expectedDirection: string
        }) => {
            // given
            const tested = new (moving())({x: 1, y: 1});

            // when
            tested.lookAt(point);

            // then
            expect(tested.currentDirection).toBe(expectedDirection);
            expect(tested.x).toBe(1);
            expect(tested.y).toBe(1);
        });

        it('does not change anything for undefined point', () => {
            // given
            const tested = new (moving())({x: 1, y: 1, direction: 'E'});

            // when
            // @ts-ignore
            tested.lookAt();

            // then
            expect(tested.currentDirection).toBe('E');
        });
    });

    describe('follow', () => {
        it('goes to the provided point', () => {
            // given
            const tested = new (moving())({x: 1, y: 1});

            // when
            tested.follow([{x: 2, y: 1}]);
            let iterations = 0;
            while (tested.inMove) {
                tested.next();
                ++iterations;
            }

            // then
            expect(tested.y).toBe(1);
            expect(tested.x).toBe(2);
            expect(iterations).toBe(1);
        });

        it('goes to the point far away', () => {
            // given
            const tested = new (moving())({x: 0, y: 0});

            // when
            tested.follow([{x: 32, y: 32}]);
            let iterations = 0;
            while (tested.inMove) {
                tested.next();
                ++iterations;
            }

            // then
            expect(tested.y).toBe(32);
            expect(tested.x).toBe(32);
            expect(iterations).toBe(64);
        });

        it('adjusts speed to achieve the point', () => {
            // given
            const tested = new (moving())({x: 0, y: 0, speed: 5});

            // when
            tested.follow([{x: 32, y: 0}]);
            let iterations = 0;
            while (tested.inMove) {
                tested.next();
                ++iterations;
            }

            // then
            expect(tested.y).toBe(0);
            expect(tested.x).toBe(32);
            expect(iterations).toBe(7);
        });

        it('goes through all the points', () => {
        });
    });
});

describe('Moving & Interacting', () => {
    it('interacts after moving', () => {
    });
});
