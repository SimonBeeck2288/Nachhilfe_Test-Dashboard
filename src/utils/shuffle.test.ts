import { describe, it, expect } from './testRunner';
import { shuffleArray } from './shuffle';

describe('Shuffle utility suite', () => {
  it('does not mutate the original array (non-mutating guarantee)', () => {
    const original = ['A', 'B', 'C', 'D', 'E'];
    const originalCopy = [...original];
    const shuffled = shuffleArray(original);

    expect(original).toEqual(originalCopy);
    expect(shuffled !== original).toBe(true);
  });

  it('preserves all original elements as a valid permutation', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);

    expect(shuffled.length).toBe(original.length);
    expect([...shuffled].sort()).toEqual([...original].sort());
  });

  it('handles empty and single-element arrays safely', () => {
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray([42])).toEqual([42]);
  });

  it('works with frozen arrays (immutability test)', () => {
    const frozen = Object.freeze(['X', 'Y', 'Z']);
    const shuffled = shuffleArray(frozen);
    expect(shuffled.length).toBe(3);
  });

  it('effectively randomizes element ordering over multiple runs', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let matchesOriginalCount = 0;
    const runs = 50;

    for (let i = 0; i < runs; i++) {
      const shuffled = shuffleArray(original);
      if (JSON.stringify(shuffled) === JSON.stringify(original)) {
        matchesOriginalCount++;
      }
    }

    expect(matchesOriginalCount).toBeLessThan(runs);
  });
});
