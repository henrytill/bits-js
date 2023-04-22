/**
 * An object that has a `getItem` method.
 *
 * @typedef {Object} HasGetItem
 * @property {(key: string) => string | null} getItem
 */

/**
 * An object that has a `setItem` method.
 *
 * @typedef {Object} HasSetItem
 * @property {(key: string, value: string) => void} setItem
 */

/**
 * @typedef {HasGetItem & HasSetItem} HasStorage
 */

/** @type {HasStorage} */
export const STORAGE_FNS = {
  getItem: localStorage.getItem.bind(localStorage),
  setItem: localStorage.setItem.bind(localStorage),
};
