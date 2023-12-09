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

    it('tracks what was added', () => {
        // given
        const heap = new BinaryHeap<number>((a) => a);

        // when
        heap.push(1);
        heap.push(10);
        heap.push(100);

        // then
        expect(heap.has(1)).toBe(true);
        expect(heap.has(10)).toBe(true);
        expect(heap.has(100)).toBe(true);
    });

    it('allows recalculating score', () => {
        // given
        const heap = new BinaryHeap<{ value: string, cost: number }>(({cost}) => cost);
        // and
        const element = {value: '1k', cost: 1000};
        // and
        heap.push({value: '1', cost: 1});
        heap.push({value: '10', cost: 10});
        heap.push({value: '100', cost: 100});
        heap.push(element);

        // when
        expect(heap.pop()).toHaveProperty('value', '1');
        // and
        element.cost = 1;
        // and
        heap.update(element);

        // then
        expect(heap.pop()).toHaveProperty('value', element.value);

        // when
        heap.push(element);
        // and
        element.cost = 11;
        // and
        heap.update(element);

        // then
        expect(heap.pop()).toHaveProperty('value', '10');
        // and
        expect(heap.pop()).toHaveProperty('value', element.value);
    });
});
