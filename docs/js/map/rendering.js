class Positioned {
    x;
    y;
    constructor(...args) {
        const { x = NaN, y = NaN } = args.filter(this.#satisfiesPositioned)[0] ?? {};
        this.x = x;
        this.y = y;
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
    return class extends (Base ?? Positioned) {
        x;
        y;
        offsetX;
        offsetY;
        width;
        height;
        wrappingWidth;
        wrappingHeight;
        constructor(...args) {
            super(args);
            const { x = NaN, y = NaN, width = DEFAULT_PX, height = DEFAULT_PX, inParent } = args.filter(this.#satisfiesInteracting)[0] ?? {};
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            [this.wrappingWidth, this.wrappingHeight] = inParent ? [inParent.width, inParent.height] : [width, height];
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
        #satisfiesInteracting(args) {
            return typeof args.x === 'number' && typeof args.y === 'number'
                && typeof args.width === 'number' && typeof args.height === 'number'
                && (args.inParent === undefined || typeof args.inParent.width === 'number' && typeof args.inParent.height === 'number');
        }
    };
}
