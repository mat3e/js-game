export class BinaryHeap<T> {
    #elements: T[] = [];
    #scores: Map<T, number> = new Map();
    #indices: Map<T, number> = new Map();

    constructor(private readonly score: (element: T) => number) {
    }

    get length() {
        return this.#elements.length;
    }

    has(potentialElement: T): boolean {
        return this.#scores.has(potentialElement);
    }

    update(element: T) {
        if (!this.has(element)) {
            return;
        }
        const oldScore = this.#scores.get(element)!;
        const newScore = this.score(element);
        if (oldScore === newScore) {
            return;
        }
        this.#scores.set(element, newScore);
        const oldIndex = this.#indices.get(element)!;
        if (oldScore < newScore) {
            this.#sinkDown(oldIndex);
            return;
        }
        this.#bubbleUp(oldIndex);
    }

    push(element: T) {
        this.#elements.push(element);
        this.#scores.set(element, this.score(element));
        this.#bubbleUp(this.#elements.length - 1);
    }

    pop(): T | undefined {
        const result = this.#elements[0];
        const end = this.#elements.pop();
        if (this.#elements.length > 0) {
            this.#elements[0] = end!;
            this.#sinkDown(0);
        }
        return result;
    }

    #bubbleUp(fromIndex: number) {
        const bubblingElement = this.#elements[fromIndex]!;
        while (fromIndex > 0) {
            const parentIndex = Math.floor((fromIndex + 1) >> 1) - 1;
            const parentElement = this.#elements[parentIndex]!;
            if (this.#scores.get(bubblingElement)! >= this.#scores.get(parentElement)!) {
                this.#indices.set(bubblingElement, fromIndex);
                break;
            }
            this.#elements[parentIndex] = bubblingElement;
            this.#elements[fromIndex] = parentElement;
            fromIndex = parentIndex;
        }
        this.#indices.set(bubblingElement, fromIndex);
    }

    #sinkDown(fromIndex: number) {
        const max = this.#elements.length;
        const sinkingElement = this.#elements[fromIndex]!;
        this.#indices.set(sinkingElement, fromIndex);
        while (true) {
            const rightChildIndex = (fromIndex + 1) << 1;
            const leftChildIndex = rightChildIndex - 1;
            let swapIndex = -1;
            if (leftChildIndex < max) {
                const leftChild = this.#elements[leftChildIndex]!;
                if (this.#scores.get(leftChild)! < this.#scores.get(sinkingElement)!) {
                    swapIndex = leftChildIndex;
                }
            }
            if (rightChildIndex < max) {
                const rightChild = this.#elements[rightChildIndex]!;
                if (this.#scores.get(rightChild)! < (swapIndex !== -1 ? this.#scores.get(this.#elements[swapIndex]!)! : this.#scores.get(sinkingElement)!)) {
                    swapIndex = rightChildIndex;
                }
            }
            if (swapIndex === -1) {
                break;
            }
            const toSwap = this.#elements[swapIndex]!;
            this.#elements[fromIndex] = toSwap;
            this.#indices.set(toSwap, fromIndex);
            this.#elements[swapIndex] = sinkingElement;
            this.#indices.set(sinkingElement, swapIndex);
            fromIndex = swapIndex;
        }
    }
}
