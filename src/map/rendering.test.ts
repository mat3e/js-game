import {interacting} from "./rendering";

describe('Colliding', () => {
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
