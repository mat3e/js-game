import { getImage, submitImage } from "./assetmanagement";
class Positioned {
    /** Left pixel. */
    x;
    /** Top pixel. */
    y;
    constructor(...args) {
        if (!this.#satisfiesPositioned(args[0])) {
            throw Error(`Positioned object must be initialized with object containing x and y. Provided ${JSON.stringify(args)}`);
        }
        const { x = NaN, y = NaN } = args[0];
        this.x = x;
        this.y = y;
    }
    next() {
        // no state changes
    }
    get valid() {
        return !isNaN(this.x) && !isNaN(this.y);
    }
    #satisfiesPositioned(args) {
        return typeof args.x === 'number' && typeof args.y === 'number';
    }
}
const DEFAULT_PX = 32;
export function interacting(Base) {
    return class InteractingImpl extends (Base ?? Positioned) {
        x;
        y;
        offsetX;
        offsetY;
        width;
        height;
        wrappingWidth;
        wrappingHeight;
        constructor(...args) {
            super(...args);
            if (!this.#satisfiesInteracting(args[0])) {
                throw Error(`Interacting object must be initialized with object containing x, y, width and height. Provided ${JSON.stringify(args)}`);
            }
            const { x = NaN, y = NaN, width = DEFAULT_PX, height = DEFAULT_PX, wrapping } = args[0];
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            [this.wrappingWidth, this.wrappingHeight] = wrapping ? [wrapping.width, wrapping.height] : [width, height];
            [this.offsetX = 0, this.offsetY = 0] = [this.wrappingWidth - width, this.wrappingHeight - height].map(value => value / 2 | 0);
        }
        contains(x, y, { strict = false } = {}) {
            const [myX = 0, myY = 0, myWidth = DEFAULT_PX, myHeight = DEFAULT_PX] = strict
                ? [this.x + this.offsetX, this.y + this.offsetY, this.width, this.height]
                : [this.x, this.y, this.wrappingWidth, this.wrappingHeight];
            return x >= myX && x < myX + myWidth && y >= myY && y < myY + myHeight;
        }
        collidesWith(another) {
            if (another.oneWayCollidesWith === undefined) {
                return another.collidesWith(this);
            }
            return this.oneWayCollidesWith(another) || another.oneWayCollidesWith(this);
        }
        oneWayCollidesWith(another) {
            return this.#corners().some(([x = Infinity, y = Infinity]) => another.contains(x, y, { strict: true }));
        }
        #corners() {
            return [[this.x, this.y], [this.x + this.width, this.y], [this.x + this.width, this.y + this.height], [this.x, this.y + this.height]];
        }
        #satisfiesInteracting(arg) {
            return typeof arg.x === 'number' && typeof arg.y === 'number'
                && typeof arg.width === 'number' && typeof arg.height === 'number'
                && (arg.wrapping === undefined || typeof arg.wrapping.width === 'number' && typeof arg.wrapping.height === 'number');
        }
    };
}
function rotating(Base) {
    const DefinedBase = Base ?? Positioned;
    if (alreadyRotating(DefinedBase)) {
        // already mixed in
        return DefinedBase;
    }
    return class RotatingImpl extends DefinedBase {
        #direction = 'S';
        constructor(...args) {
            super(...args);
            if (typeof args[0].direction === 'string') {
                this.#direction = args[0].direction;
            }
        }
        lookAt({ x = this.x, y = this.y } = { x: this.x, y: this.y }) {
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
        get currentDirection() {
            return this.#direction;
        }
    };
}
export function moving(Base) {
    return class MovingImpl extends rotating(Base ?? Positioned) {
        x;
        y;
        #path = [];
        #deltaX = Delta.of(0);
        #deltaY = Delta.of(0);
        #moving = false;
        #speed;
        constructor(...args) {
            super(...args);
            if (!this.#satisfiesMoving(args[0])) {
                throw Error(`Moving object must be initialized with object containing x, y and speed. Provided ${JSON.stringify(args)}`);
            }
            const { x = NaN, y = NaN, speed = 1 } = args[0];
            [this.x, this.y, this.#speed] = [x, y, speed];
        }
        get inMove() {
            return this.#moving;
        }
        follow(path) {
            this.#path = path.reverse();
            this.#deltas = this.#path.pop();
            this.#moving = true;
        }
        next() {
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
            }
            else if (!this.#deltaY.done) {
                this.y += this.#deltaY.next();
            }
            if (this.#atTarget) {
                this.#deltas = this.#path.pop();
            }
        }
        set #deltas(point) {
            const { x = this.x, y = this.y } = point ?? { x: this.x, y: this.y };
            this.lookAt({ x, y });
            this.#deltaX = Delta.of(this.x - x, this.#speed);
            this.#deltaY = Delta.of(this.y - y, this.#speed);
        }
        get #notThereYet() {
            return !this.#atTarget;
        }
        get #atTarget() {
            return this.#deltaX.done && this.#deltaY.done;
        }
        #satisfiesMoving(arg) {
            return typeof arg.x === 'number' && typeof arg.y === 'number'
                && (arg.speed === undefined || typeof arg.speed === 'number');
        }
    };
}
class Delta {
    static of(diff, increment = 1) {
        return diff > 0 ? new Delta(diff, -1, increment) : new Delta(diff, 1, increment);
    }
    #diff;
    #change;
    #sign;
    constructor(diff, sign, change = 1) {
        this.#diff = diff;
        this.#change = change;
        this.#sign = sign;
    }
    next() {
        const newDelta = this.#diff + this.#sign * this.#change;
        if (this.#crossedZero(newDelta)) {
            this.#diff = 0;
            return this.#change - this.#sign * newDelta;
        }
        this.#diff = newDelta;
        return this.#change;
    }
    get done() {
        return this.#diff === 0;
    }
    #crossedZero(newDelta) {
        return this.#sign * newDelta > 0;
    }
}
function alreadyRotating(Class) {
    return !!(Class.prototype.lookAt);
}
export function renderable(Base) {
    return class RenderableImpl extends (Base ?? Positioned) {
        x;
        y;
        width;
        height;
        context;
        sprite;
        constructor(...args) {
            super(...args);
            if (!this.#satisfiesRenderable(args[0])) {
                throw Error(`Renderable object must be initialized with object containing x, y, width, height, context and sprite. Provided ${JSON.stringify(args)}`);
            }
            const { x = NaN, y = NaN, width = DEFAULT_PX, height = DEFAULT_PX, context, sprite } = args[0];
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
        render() {
            this.context.drawImage(getImage(this.sprite.src), this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height, this.x, this.y, this.width, this.height);
        }
        #satisfiesRenderable(arg) {
            return typeof arg.x === 'number' && typeof arg.y === 'number'
                && typeof arg.width === 'number' && typeof arg.height === 'number'
                && typeof arg.context === 'object'
                && (typeof arg.sprite === 'object' && typeof arg.sprite.src === 'string'
                    && (arg.sprite.x === undefined || typeof arg.sprite.x === 'number') && (arg.sprite.y === undefined || typeof arg.sprite.y === 'number')
                    && (arg.sprite.width === undefined || typeof arg.sprite.width === 'number') && (arg.sprite.height === undefined || typeof arg.sprite.height === 'number'));
        }
    };
}
export function animated(Base) {
    return class AnimatedImpl extends rotating(Base ?? Positioned) {
    };
}
