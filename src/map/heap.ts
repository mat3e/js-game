export class BinaryHeap<T> {
    #elements: T[] = [];
    #scores: Map<T, number> = new Map();

    // todo: standard binary heap based priority queue does not directly support the operation of searching for one of its elements, but it can be augmented with a hash table that maps elements to their position in the heap, allowing this decrease-priority operation to be performed in logarithmic time

    constructor(private readonly score: (element: T) => number) {
    }

    get length() {
        return this.#elements.length;
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
                break;
            }
            this.#elements[parentIndex] = bubblingElement;
            this.#elements[fromIndex] = parentElement;
            fromIndex = parentIndex;
        }
    }

    #sinkDown(fromIndex: number) {
        const max = this.#elements.length;
        const sinkingElement = this.#elements[fromIndex]!;
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
            this.#elements[fromIndex] = this.#elements[swapIndex]!;
            this.#elements[swapIndex] = sinkingElement;
            fromIndex = swapIndex;
        }
    }
}
