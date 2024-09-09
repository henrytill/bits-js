/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array} TypedArray
 */

/**
 * Creates a thunk that returns the result of `render(value)`.  The result is
 * cached, so that subsequent calls to the thunk return the cached value.
 *
 * @template T, U
 * @param {T} value - The value to be passed to `render`.
 * @param {(value: T) => U} render - The function to be called with `value`.
 * @returns {() => U} A thunk that returns the result of `render(value)`.
 */
export const makeLazy = (value, render) => {
  let rendered = false;
  /** @type {U} */
  let ret;
  return () => {
    if (rendered) {
      return ret;
    } else {
      ret = render(value);
      rendered = true;
      return ret;
    }
  };
};

/**
 * @typedef {{ tag: string }} HasTag
 */

/**
 * Creates a pattern matching function.
 *
 * @template {HasTag} T
 * @template U
 * @param {Record<string, (value: any) => U>} patterns - An object containing patterns as functions.
 * @returns {(value: T) => U} A function that takes a value and applies the corresponding pattern to it.
 */
export const match = (patterns) => (value) => {
  const pattern = patterns[value.tag] || patterns._;
  if (typeof pattern === 'function') {
    return pattern(value);
  } else {
    throw new Error(`No matching pattern for value: ${JSON.stringify(value)}`);
  }
};

/**
 * @param {string} path
 * @param {boolean} [stamp=true]
 * @param {number} [timestamp]
 * @returns {string}
 */
export const dynamicPath = (path, stamp = true, timestamp = new Date().getTime()) =>
  stamp ? `${path}?v=${timestamp}` : path;
