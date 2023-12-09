import {Point} from "./pathfinding/index";
import {getImage, submitImage} from "./assetmanagement";

/**
 * Allows transiting to the next frame.
 */
type WithFrames = {
    next(): void;
}

type State = 'idle' | 'moving' | 'collided' | 'pointed';

class Positioned implements WithFrames {
    /** Left pixel. */
    readonly x: number;
    /** Top pixel. */
    readonly y: number;
    #state: State = 'idle';

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

    protected set state(state: State) {
        this.#state = state;
    }

    protected get state(): State {
        return this.#state;
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
                wrapping
            } = args[0];
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            [this.wrappingWidth, this.wrappingHeight] = wrapping ? [wrapping.width, wrapping.height] : [width, height];
            [this.offsetX = 0, this.offsetY = 0] = [this.wrappingWidth - width, this.wrappingHeight - height].map(value => value / 2 | 0);
        }

        contains(x: number, y: number, {strict = false} = {}): boolean {
            const [myX = 0, myY = 0, myWidth = DEFAULT_PX, myHeight = DEFAULT_PX] = strict
                ? [this.x + this.offsetX, this.y + this.offsetY, this.width, this.height]
                : [this.x, this.y, this.wrappingWidth, this.wrappingHeight];
            const result = x >= myX && x < myX + myWidth && y >= myY && y < myY + myHeight;
            if (result) {
                this.state = 'pointed';
            }
            return result;
        }

        collidesWith(another: Interacting): boolean {
            if ((another as this).oneWayCollidesWith === undefined) {
                const resultFromOtherImpl = another.collidesWith(this);
                this.#collidingState(resultFromOtherImpl, another);
                return resultFromOtherImpl;
            }
            const result = this.oneWayCollidesWith(another) || (another as this).oneWayCollidesWith(this);
            this.#collidingState(result, another);
            return result;
        }

        private oneWayCollidesWith(another: Interacting): boolean {
            return this.#corners.some(([x = Infinity, y = Infinity]) => another.contains(x, y, {strict: true}));
        }

        #collidingState(isCollided: boolean, another: Interacting) {
            if (isCollided) {
                this.state = 'collided';
                const tsAnother = (another as this);
                if (tsAnother.state) {
                    tsAnother.state = 'collided';
                }
            }
        }

        get #corners(): [[number, number], [number, number], [number, number], [number, number]] {
            return [[this.x, this.y], [this.x + this.width, this.y], [this.x + this.width, this.y + this.height], [this.x, this.y + this.height]];
        }

        #satisfiesInteracting(arg: any): arg is InteractingState {
            return typeof arg.x === 'number' && typeof arg.y === 'number'
                && typeof arg.width === 'number' && typeof arg.height === 'number'
                && (arg.wrapping === undefined || typeof arg.wrapping.width === 'number' && typeof arg.wrapping.height === 'number');
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
    wrapping?: TwoDimensional;
};

type TwoDimensional = {
    width: number;
    height: number;
};

function rotating<TBase extends typeof Positioned>(Base?: TBase): new (...args: any[]) => Rotating & Positioned {
    const DefinedBase = Base ?? Positioned;
    if (alreadyRotating(DefinedBase)) {
        // already mixed in
        return DefinedBase;
    }
    return class RotatingImpl extends DefinedBase implements Rotating {
        #direction: Direction = 'S';

        constructor(...args: any[]) {
            super(...args);
            if (typeof args[0].direction === 'string') {
                this.#direction = args[0].direction;
            }
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

        get currentDirection(): Direction {
            return this.#direction;
        }
    }
}

export function moving(): new (state: MovingState) => (Moving & Positioned);
export function moving<TBase extends typeof Positioned>(Base: TBase): new (...args: MixinConstructorArgs<MovingState, TBase>) => (Moving & InstanceType<TBase>);
export function moving<TBase extends typeof Positioned>(Base?: TBase) {
    return class MovingImpl extends rotating(Base ?? Positioned) implements Moving {
        override x: number;
        override y: number;
        #path: Point[] = [];
        #deltaX = Delta.of(0);
        #deltaY = Delta.of(0);
        #speed: number;

        constructor(...args: any[]) {
            super(...args);
            if (!this.#satisfiesMoving(args[0])) {
                throw Error(`Moving object must be initialized with object containing x, y and speed. Provided ${JSON.stringify(args)}`);
            }
            const {
                x = NaN,
                y = NaN,
                speed = 1
            } = args[0];
            [this.x, this.y, this.#speed] = [x, y, speed];
        }

        get inMove(): boolean {
            return this.state === 'moving';
        }

        follow(path: Point[]): void {
            this.#path = path.reverse();
            this.#deltas = this.#path.pop();
            this.state = 'moving';
        }

        override next(): void {
            super.next();
            if (this.state !== 'moving') {
                return;
            }
            if (this.#notThereYet) {
                this.#move();
            }
            if (this.#atTarget) {
                this.state = 'idle';
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

type Moving = Rotating & WithFrames & {
    get inMove(): boolean;
    // todo: events?
    follow(path: Point[]): void;
};

type MovingState = Point & RotatingState & {
    speed?: number;
};

type Rotating = {
    lookAt(point: Point): void;
    get currentDirection(): Direction;
};

function alreadyRotating<TBase extends typeof Positioned>(Class: typeof Positioned): Class is new (...args: any[]) => (Rotating & InstanceType<TBase>) {
    return !!((Class.prototype as unknown as Rotating).lookAt);
}

type RotatingState = {
    direction?: Direction;
};

type Direction = 'N' | 'E' | 'S' | 'W';

// type DiagonalDirection = 'NE' | 'NW' | 'SE' | 'SW';

export function renderable(): new (state: RenderableState) => (Renderable & Positioned);
export function renderable<TBase extends typeof Positioned>(Base: TBase): new (...args: MixinConstructorArgs<RenderableState, TBase>) => (Renderable & InstanceType<TBase>);
export function renderable<TBase extends typeof Positioned>(Base?: TBase) {
    return class RenderableImpl extends (Base ?? Positioned) implements Renderable {
        override readonly x: number;
        override readonly y: number;
        private readonly width: number;
        private readonly height: number;
        private readonly context: CanvasDrawImage;
        private readonly sprite: Required<RenderableState['sprite']>;

        constructor(...args: any[]) {
            super(...args);
            if (!this.#satisfiesRenderable(args[0])) {
                throw Error(`Renderable object must be initialized with object containing x, y, width, height, context and sprite. Provided ${JSON.stringify(args)}`);
            }
            const {
                x = NaN,
                y = NaN,
                width = DEFAULT_PX,
                height = DEFAULT_PX,
                context,
                sprite
            } = args[0];
            [this.x, this.y, this.width, this.height, this.context] = [x, y, width, height, context];
            this.sprite = {
                src: sprite.src,
                x: sprite.x ?? 0,
                y: sprite.y ?? 0,
                width: sprite.width ?? width,
                height: sprite.height ?? height,
            };
            submitImage(this.sprite.src);
        }

        render(): void {
            this.context.drawImage(getImage(this.sprite.src), this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height, this.x, this.y, this.width, this.height);
        }

        #satisfiesRenderable(arg: any): arg is RenderableState {
            return typeof arg.x === 'number' && typeof arg.y === 'number'
                && typeof arg.width === 'number' && typeof arg.height === 'number'
                && typeof arg.context === 'object'
                && (typeof arg.sprite === 'object' && typeof arg.sprite.src === 'string'
                    && (arg.sprite.x === undefined || typeof arg.sprite.x === 'number') && (arg.sprite.y === undefined || typeof arg.sprite.y === 'number')
                    && (arg.sprite.width === undefined || typeof arg.sprite.width === 'number') && (arg.sprite.height === undefined || typeof arg.sprite.height === 'number'));
        }
    }
}

type Renderable = {
    render(): void;
};

type RenderableState = Point & TwoDimensional & {
    context: CanvasDrawImage;
    sprite: Partial<Point> & Partial<TwoDimensional> & {
        src: string;
    };
};

export function animated(): new (state: AnimatedState) => (Animated & Positioned);
export function animated<TBase extends typeof Positioned>(Base: TBase): new (...args: MixinConstructorArgs<AnimatedState, TBase>) => (Animated & InstanceType<TBase>);
export function animated<TBase extends typeof Positioned>(Base?: TBase) {
    return class AnimatedImpl extends rotating(Base ?? Positioned) implements Animated {
    }
}

type Animated = Rotating & {};

type AnimatedState = Point & {};

/** Assumes state is always the first argument. */
type MixinConstructorArgs<NewStateType, SuperClass extends abstract new (...args: any) => any>
    = [NewStateType & ConstructorParameters<SuperClass>[0], ...Tail<ConstructorParameters<SuperClass>>];

type Tail<T extends any[]> = T extends [unknown, ...infer R] ? R : never;
