/**
 * A `FluidContext` is a mechanism for dynamically scoping a value.  This value
 * is called the "fluid variable".
 *
 * @typedef {Object} FluidContext
 * @property {(val: any, cb: (...args: any[]) => any, args?: any[]) => any} run - Runs a function in a fluid context.
 * @property {() => any} get - Gets the current value of the fluid variable.
 * @property {(val: any) => any} set - Sets the current value of the fluid variable.
 */

/**
 * Makes a `FluidContext`.
 *
 * @returns {Readonly<FluidContext>}
 */
export const makeFluidContext = () => {
  /** @type {any} */
  let state;

  /** @type {(val: any, cb: (...args: any[]) => any, args?: any[]) => any} */
  const run = (val, cb, args = []) => {
    const prev = state;
    try {
      state = val;
      return cb(...args);
    } finally {
      state = prev;
    }
  };

  /** @type {() => any} */
  const get = () => state;

  /** @type {(val: any) => any} */
  const set = (val) => {
    state = val;
    return state;
  };

  return Object.freeze({ run, get, set });
};
