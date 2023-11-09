import {BinaryHeap} from "./heap";

describe('BinaryHeap', () => {
    it('accepts a scoring function', () => {
        const heap = new BinaryHeap<number>((a) => a);
        expect(heap).toBeDefined();
    });

    it('stores element', () => {
        // given
        const heap = new BinaryHeap<number>((a) => a);

        // when
        heap.push(1);

        // then
        expect(heap).toHaveLength(1);
        // and
        expect(heap.pop()).toBe(1);
        // and
        expect(heap).toHaveLength(0);
    });

    it('pops the smallest element', () => {
        // given
        const heap = new BinaryHeap<number>((a) => a);

        // when
        heap.push(100);
        heap.push(10);

        // then
        expect(heap.pop()).toBe(10);
        // and
        expect(heap.pop()).toBe(100);
        // and
        expect(heap).toHaveLength(0);
    });

    it('works with objects and reverse order', () => {
        // given
        const heap = new BinaryHeap<{ value: number }>(({value}) => -value);

        // when
        heap.push({value: 1});
        heap.push({value: 10});
        heap.push({value: 100});

        // then
        expect(heap.pop()).toHaveProperty('value', 100);
        // and
        expect(heap).toHaveLength(2);

        // when
        heap.push({value: 1_000});

        // then
        expect(heap.pop()).toHaveProperty('value', 1_000);
        expect(heap.pop()).toHaveProperty('value', 10);
        // and
        expect(heap).toHaveLength(1);
    });
});
