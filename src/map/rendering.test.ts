import {Point} from "./pathfinding/index";
import {animated, interacting, moving} from "./rendering";

describe('Interacting', () => {
    describe('contains', () => {
        it('takes parent dimensions by default', () => {
            // given
            const interactingObject = new (interacting())({
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                wrapping: {
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
                wrapping: {
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
            const first = new (interacting())({x, y, width: 10, height: 3, wrapping: {width: 100, height: 100}});
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
            // given
            const tested = new (moving())({x: 0, y: 0, speed: 4});

            // when
            tested.follow([{x: 32, y: 0}, {x: 32, y: 32}, {x: 64, y: 64}]);
            let iterations = 0;
            while (tested.inMove) {
                tested.next();
                ++iterations;
                switch (true) {
                    case iterations === 8:
                        expect(tested.x).toBe(32);
                        expect(tested.y).toBe(0);
                        break;
                    case iterations === 16:
                        expect(tested.x).toBe(32);
                        expect(tested.y).toBe(32);
                        break;
                    case iterations === 24:
                        expect(tested.x).toBe(64);
                        expect(tested.y).toBe(32);
                        break;
                }
            }

            // then
            expect(tested.y).toBe(64);
            expect(tested.x).toBe(64);
            expect(iterations).toBe(32);
        });
    });
});

describe('Moving & Interacting', () => {
    function doFollow(tested: InstanceType<ReturnType<typeof moving>>, path: Point[]) {
        tested.follow(path);
        while (tested.inMove) {
            tested.next();
        }
    }

    it('interacts after moving', () => {
        // given
        const obstacle = new (interacting())({x: 8, y: 1, width: 10, height: 4});
        const tested = new (moving(interacting()))({x: 0, y: 0, width: 1, height: 1});

        expect(tested.collidesWith(obstacle)).toBe(false);

        // when
        doFollow(tested, [{x: 10, y: 3}]);

        // then
        expect(tested.collidesWith(obstacle)).toBe(true);

        // when
        doFollow(tested, [{x: 19, y: 6}]);

        // then
        expect(obstacle.collidesWith(tested)).toBe(false);
    });
});

describe('Animated', () => {
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
            const tested = new (animated())({x: 1, y: 1});
            const doubled = new (animated(moving()))({x: 1, y: 1});
            const otherDoubled = new (moving(animated()))({x: 1, y: 1});

            // when
            tested.lookAt(point);
            doubled.lookAt(point);
            otherDoubled.lookAt(point);

            // then
            expect(tested.currentDirection).toBe(expectedDirection);
            expect(doubled.currentDirection).toBe(expectedDirection);
            expect(otherDoubled.currentDirection).toBe(expectedDirection);
        });
    });
});
