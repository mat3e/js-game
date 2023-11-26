import {Point} from "./pathfinding/index";

/**
 * Allows transiting to the next frame.
 */
interface WithFrames {
    next(): void;
}

class Positioned implements WithFrames {
    /** Left pixel. */
    readonly x: number;
    /** Top pixel. */
    readonly y: number;

    constructor(...args: any[]) {
        if (!this.#satisfiesPositioned(args[0])) {
            throw Error(`Positioned object must be initialized with object containing x and y. Provided ${JSON.stringify(args)}`);
        }
        const {x = NaN, y = NaN} = args[0];
        this.x = x;
        this.y = y;
    }

    next(): void {
        // no state changes
    }

    get valid(): boolean {
        return !isNaN(this.x) && !isNaN(this.y);
    }

    #satisfiesPositioned(args: any): args is Point {
        return typeof args.x === 'number' && typeof args.y === 'number';
    }
}

const DEFAULT_PX = 32;

export function interacting(): new (state: InteractingState) => (Interacting & Positioned);
export function interacting<TBase extends typeof Positioned>(Base: TBase): new (...args: MixinConstructorArgs<InteractingState, TBase>) => (Interacting & InstanceType<TBase>);
export function interacting<TBase extends typeof Positioned>(Base?: TBase) {
    return class InteractingImpl extends (Base ?? Positioned) implements Interacting {
        override readonly x: number;
        override readonly y: number;
        private readonly offsetX: number;
        private readonly offsetY: number;
        private readonly width: number;
        private readonly height: number;
        private readonly wrappingWidth: number;
        private readonly wrappingHeight: number;

        constructor(...args: any[]) {
            super(...args);
            if (!this.#satisfiesInteracting(args[0])) {
                throw Error(`Interacting object must be initialized with object containing x, y, width and height. Provided ${JSON.stringify(args)}`);
            }
            const {
                x = NaN,
                y = NaN,
                width = DEFAULT_PX,
                height = DEFAULT_PX,
                inParent
            } = args[0];
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

        #satisfiesInteracting(arg: any): arg is InteractingState {
            return typeof arg.x === 'number' && typeof arg.y === 'number'
                && typeof arg.width === 'number' && typeof arg.height === 'number'
                && (arg.inParent === undefined || typeof arg.inParent.width === 'number' && typeof arg.inParent.height === 'number');
        }
    }
}

type Interacting = {
    contains(x: number, y: number, options?: InteractingOptions): boolean;
    collidesWith(another: Interacting): boolean;
};

type InteractingOptions = {
    strict?: boolean;
};

type InteractingState = Point & TwoDimensional & {
    inParent?: TwoDimensional;
};

type TwoDimensional = {
    width: number;
    height: number;
};

export function moving(): new (state: MovingState) => (Moving & Positioned);
export function moving<TBase extends typeof Positioned>(Base: TBase): new (...args: MixinConstructorArgs<MovingState, TBase>) => (Moving & InstanceType<TBase>);
export function moving<TBase extends typeof Positioned>(Base?: TBase) {
    return class MovingImpl extends (Base ?? Positioned) implements Moving {
        override x: number;
        override y: number;
        #direction: Direction;
        #path: Point[] = [];
        #deltaX = Delta.of(0);
        #deltaY = Delta.of(0);
        #moving: boolean = false;
        #speed: number;

        constructor(...args: any[]) {
            super(...args);
            if (!this.#satisfiesMoving(args[0])) {
                throw Error(`Moving object must be initialized with object containing x, y, direction and speed. Provided ${JSON.stringify(args)}`);
            }
            const {
                x = NaN,
                y = NaN,
                direction = 'S',
                speed = 1
            } = args[0];
            [this.x, this.y, this.#direction, this.#speed] = [x, y, direction, speed];
        }

        get currentDirection(): Direction {
            return this.#direction;
        }

        get inMove(): boolean {
            return this.#moving;
        }

        lookAt({x = this.x, y = this.y}: Point = {x: this.x, y: this.y}): void {
            switch (true) {
                case (this.x) > x:
                    this.#direction = 'W';
                    break;
                case (this.x) < x:
                    this.#direction = 'E';
                    break;
                case (this.y) > y:
                    this.#direction = 'N';
                    break;
                case (this.y) < y:
                    this.#direction = 'S';
                    break;
            }
        }

        follow(path: Point[]): void {
            this.#path = path.reverse();
            this.#deltas = this.#path.pop();
            this.#moving = true;
        }

        override next(): void {
            super.next();
            if (!this.#moving) {
                return;
            }
            if (this.#notThereYet) {
                this.#move();
            }
            if (this.#atTarget) {
                this.#moving = false;
            }
        }

        #move() {
            if (!this.#deltaX.done) {
                this.x += this.#deltaX.next();
            } else if (!this.#deltaY.done) {
                this.y += this.#deltaY.next();
            }
            if (this.#atTarget) {
                this.#deltas = this.#path.pop();
            }
        }

        set #deltas(point: Point | undefined) {
            const {x = this.x, y = this.y} = point ?? {x: this.x, y: this.y};
            this.lookAt({x, y});
            this.#deltaX = Delta.of(this.x - x, this.#speed);
            this.#deltaY = Delta.of(this.y - y, this.#speed);
        }

        get #notThereYet(): boolean {
            return !this.#atTarget;
        }

        get #atTarget() {
            return this.#deltaX.done && this.#deltaY.done;
        }

        #satisfiesMoving(arg: any): arg is MovingState {
            return typeof arg.x === 'number' && typeof arg.y === 'number'
                && (arg.direction === undefined || typeof arg.direction === 'string')
                && (arg.speed === undefined || typeof arg.speed === 'number');
        }
    };
}

class Delta {
    static of(diff: number, increment: number = 1): Delta {
        return diff > 0 ? new Delta(diff, -1, increment) : new Delta(diff, 1, increment);
    }

    #diff: number;
    readonly #change: number;
    readonly #sign: -1 | 1;

    private constructor(diff: number, sign: -1 | 1, change: number = 1) {
        this.#diff = diff;
        this.#change = change;
        this.#sign = sign;
    }

    next(): number {
        const newDelta: number = this.#diff + this.#sign * this.#change;
        if (this.#crossedZero(newDelta)) {
            this.#diff = 0;
            return this.#change - this.#sign * newDelta;
        }
        this.#diff = newDelta;
        return this.#change;
    }

    get done(): boolean {
        return this.#diff === 0;
    }

    #crossedZero(newDelta: number): boolean {
        return this.#sign * newDelta > 0;
    }
}

type Moving = {
    get inMove(): boolean;
    get currentDirection(): Direction;
    lookAt(point: Point): void;
    // todo: events?
    follow(path: Point[]): void;
};

type MovingState = Point & {
    direction?: Direction;
    speed?: number;
};

type Direction = 'N' | 'E' | 'S' | 'W';

// type DiagonalDirection = 'NE' | 'NW' | 'SE' | 'SW';

/** Assumes state is always the first argument. */
type MixinConstructorArgs<NewStateType, SuperClass extends abstract new (...args: any) => any>
    = [NewStateType & ConstructorParameters<SuperClass>[0], ...Tail<ConstructorParameters<SuperClass>>];

type Tail<T extends any[]> = T extends [unknown, ...infer R] ? R : never;
