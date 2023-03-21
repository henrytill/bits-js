// @ts-check

import { greet } from "./greet.mjs";

// @ts-ignore
const assert = chai.assert;

console.log(greet("Henry"));

describe("Array", function () {
  describe("#indexOf()", function () {
    it("should return -1 when the value is not present", function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
