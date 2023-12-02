// eslint-env node

import test from 'node:test';
import assert from 'node:assert';

import * as fluid from '../static/fluid.mjs';

test('make() should construct a fluid context', (_) => {
  const fluidContext = fluid.makeFluidContext();
  assert.ok(fluidContext instanceof Object);
  assert.ok(Object.prototype.hasOwnProperty.call(fluidContext, 'set'));
  assert.ok(Object.prototype.hasOwnProperty.call(fluidContext, 'get'));
  assert.ok(Object.prototype.hasOwnProperty.call(fluidContext, 'set'));
});

test('run() should run a function', (_) => {
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
  assert.strictEqual(result, 6);
  assert.strictEqual(fluidContext.get(), 42);
});
