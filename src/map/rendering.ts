import {Point} from "./pathfinding/index";

abstract class Positioned {
    readonly x: number;
    readonly y: number;

    protected constructor(...args: any[]) {
        const {x = NaN, y = NaN} = args.filter(this.#satisfiesPositioned)[0] ?? {};
        this.x = x;
        this.y = y;
    }

    get valid(): boolean {
        return !isNaN(this.x) && !isNaN(this.y);
    }

    #satisfiesPositioned(args: any): args is Point {
        return typeof args.x === 'number' && typeof args.y === 'number';
    }
}

const DEFAULT_PX = 32;

export function interacting<TBase extends typeof Positioned>(Base?: TBase): new (...args: any[]) => Interacting {
    return class extends (Base ?? Positioned) implements Interacting {
        override readonly x: number;
        override readonly y: number;
        private readonly offsetX: number;
        private readonly offsetY: number;
        private readonly width: number;
        private readonly height: number;
        private readonly wrappingWidth: number;
        private readonly wrappingHeight: number;

        constructor(...args: any[]) {
            super(args);
            const {
                x = NaN,
                y = NaN,
                width = DEFAULT_PX,
                height = DEFAULT_PX,
                inParent
            } = args.filter(this.#satisfiesInteracting)[0] ?? {};
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            [this.wrappingWidth, this.wrappingHeight] = inParent ? [inParent.width, inParent.height] : [width, height];
            [this.offsetX = 0, this.offsetY = 0] = [this.wrappingWidth - width, this.wrappingHeight - height].map(value => value / 2 | 0);
        }

        contains(x: number, y: number, {strict = false} = {}): boolean {
            const [myX = 0, myY = 0, myWidth = DEFAULT_PX, myHeight = DEFAULT_PX] = strict
                ? [this.x + this.offsetX, this.y + this.offsetY, this.width, this.height]
                : [this.x, this.y, this.wrappingWidth, this.wrappingHeight];
            return x >= myX && x < myX + myWidth && y >= myY && y < myY + myHeight;
        }

        collidesWith(another: Interacting): boolean {
            if ((another as this).oneWayCollidesWith === undefined) {
                return another.collidesWith(this);
            }
            return this.oneWayCollidesWith(another) || (another as this).oneWayCollidesWith(this);
        }

        private oneWayCollidesWith(another: Interacting): boolean {
            return this.#corners().some(([x = Infinity, y = Infinity]) => another.contains(x, y, {strict: true}));
        }

        #corners(): [[number, number], [number, number], [number, number], [number, number]] {
            return [[this.x, this.y], [this.x + this.width, this.y], [this.x + this.width, this.y + this.height], [this.x, this.y + this.height]];
        }

        #satisfiesInteracting(args: any): args is InteractingState {
            return typeof args.x === 'number' && typeof args.y === 'number'
                && typeof args.width === 'number' && typeof args.height === 'number'
                && (args.inParent === undefined || typeof args.inParent.width === 'number' && typeof args.inParent.height === 'number');
        }
    }
}

type Interacting = {
    contains(x: number, y: number, options?: InteractingOptions): boolean;
    collidesWith(another: Interacting): boolean;
}

type InteractingOptions = {
    strict?: boolean;
}

type InteractingState = Point & TwoDimensional & {
    inParent?: TwoDimensional;
}

type TwoDimensional = {
    width: number;
    height: number;
}
