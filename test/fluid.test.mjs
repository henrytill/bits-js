// @ts-check

import { expect } from '@esm-bundle/chai';
import { makeFluidContext } from '../static/fluid.mjs';

describe('makeFluidContext()', function () {
  it('should construct a fluid context', function () {
    const fluidContext = makeFluidContext();
    expect(fluidContext).to.haveOwnProperty('run');
    expect(fluidContext).to.haveOwnProperty('get');
  });
});

describe('FluidContext', function () {
  describe('#run()', function () {
    it('should run a function', function () {
      const fluidContext = makeFluidContext();
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
      expect(result).to.equal(6);
      expect(fluidContext.get()).to.equal(42);
    });
  });
});
