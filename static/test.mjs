// @ts-check

/**
 * Create a greeting
 *
 * @param {string} person - The name of a person to greet
 * @param {Date} today - Today's date
 * @returns {string}
 */
function greet(person, today = new Date()) {
    return `Hello ${person}, today is ${today.toDateString()}!`;
}

console.log(greet("Henry"));

/** TESTS */

// @ts-ignore
const assert = chai.assert;

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});
