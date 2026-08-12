let describeFn: any;
let itFn: any;
let expectFn: any;

try {
  // @ts-ignore
  const v = await import('vitest');
  describeFn = v.describe;
  itFn = v.it;
  expectFn = v.expect;
} catch {
  describeFn = (name: string, fn: () => void) => {
    console.log(`\nDescribe: ${name}`);
    fn();
  };
  itFn = (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      console.error(`  ✕ ${name}:`, err.message);
      throw err;
    }
  };
  expectFn = (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected) throw new Error(`Expected ${actual} to be ${expected}`);
    },
    toBeGreaterThan: (expected: any) => {
      if (!(actual > expected)) throw new Error(`Expected ${actual} > ${expected}`);
    },
    toBeGreaterThanOrEqual: (expected: any) => {
      if (!(actual >= expected)) throw new Error(`Expected ${actual} >= ${expected}`);
    },
    toBeLessThan: (expected: any) => {
      if (!(actual < expected)) throw new Error(`Expected ${actual} < ${expected}`);
    },
    toBeLessThanOrEqual: (expected: any) => {
      if (!(actual <= expected)) throw new Error(`Expected ${actual} <= ${expected}`);
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    },
    toBeNull: () => {
      if (actual !== null) throw new Error(`Expected ${actual} to be null`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected ${actual} to be truthy`);
    },
    toBeFalsy: () => {
      if (actual) throw new Error(`Expected ${actual} to be falsy`);
    },
  });
}

export const describe = describeFn;
export const it = itFn;
export const expect = expectFn;
