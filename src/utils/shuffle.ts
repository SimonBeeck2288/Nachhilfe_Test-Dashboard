/**
 * Pure, non-mutating Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new array with elements in randomized order.
 */
export function shuffleArray<T>(array: readonly T[] | T[]): T[] {
  if (!array || array.length <= 1) {
    return array ? [...array] : [];
  }
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
