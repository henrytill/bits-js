// @ts-check

import * as fluid from './fluid.mjs';
import * as test from './test.mjs';

const makeShouldConstruct = test.makeTest(
  'make() should construct a fluid context',
  () => {
    const fluidContext = fluid.makeFluidContext();
    test.assert(fluidContext instanceof Object);
    test.assert(fluidContext.hasOwnProperty('run'));
    test.assert(fluidContext.hasOwnProperty('get'));
    test.assert(fluidContext.hasOwnProperty('set'));
  },
);

const runShouldRunAFunction = test.makeTest(
  'run() should run a function',
  () => {
    const fluidContext = fluid.makeFluidContext();
    fluidContext.set(42);
    const result = fluidContext.run(
      3,
      (x, y) => {
        let z = fluidContext.get();
        let result = x + y + z;
        return fluidContext.set(result);
      },
      [1, 2],
    );
    test.assert(result === 6);
    test.assert(fluidContext.get() === 42);
  },
);

export const tests = [makeShouldConstruct, runShouldRunAFunction];
