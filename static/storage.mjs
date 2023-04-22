/**
 * @typedef {{ getItem: (key: string) => string | null }} HasGetItem
 * @typedef {{ setItem: (key: string, value: string) => void }} HasSetItem
 * @typedef {HasGetItem & HasSetItem} HasStorage
 */

/** @type {HasStorage} */
export const STORAGE_FNS = {
  getItem: localStorage.getItem.bind(localStorage),
  setItem: localStorage.setItem.bind(localStorage),
};
