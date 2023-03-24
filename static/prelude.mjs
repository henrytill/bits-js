/**
 * @template T, U
 * @param {T} value
 * @param {(value: T) => U} render
 * @returns {() => U}
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
