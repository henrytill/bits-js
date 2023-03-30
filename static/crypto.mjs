// @ts-check

import { makeLazy } from './prelude.mjs';

/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array} TypedArray
 *
 * @typedef {{ encode: () => Uint8Array }} HasEncode
 *
 * @typedef {{ buffer: () => ArrayBuffer }} HasBuffer
 *
 * @typedef {{ text: () => string }} HasText
 *
 * @typedef {HasText & {
 *   generateKey: (salt: Uint8Array) => Promise<CryptoKey>
 * }} Password
 *
 * @typedef {HasText & HasEncode} Plaintext
 *
 * @typedef {HasBuffer} Ciphertext
 */

const KEY_DERIVATION_FN = 'PBKDF2';
const ALGO_NAME = 'AES-GCM';

/**
 * @param {string} text
 * @returns {HasEncode}
 */
const makeTextEncoder = (text) => {
  const encode = makeLazy(text, (t) => {
    const encoder = new TextEncoder();
    return encoder.encode(t);
  });
  return Object.freeze({ encode });
};

/**
 * @param {HasEncode} password
 * @returns {Promise<CryptoKey>}
 */
const generateKeyMaterial = (password) => {
  return window.crypto.subtle.importKey(
    'raw',
    password.encode(),
    { name: KEY_DERIVATION_FN },
    false,
    ['deriveBits', 'deriveKey'],
  );
};

/**
 * @param {string} password
 * @returns {Password}
 */
export const makePassword = (password) => {
  const text = () => password;
  const encoder = makeTextEncoder(password);
  const generateKey = async (/** @type {Uint8Array} */ salt) => {
    const keyMaterial = await generateKeyMaterial(encoder);
    return window.crypto.subtle.deriveKey(
      { name: KEY_DERIVATION_FN, salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO_NAME, length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  };
  return Object.freeze({ text, generateKey });
};

/**
 * @param {string} plaintext
 * @returns {Plaintext}
 */
export const makePlaintext = (plaintext) => {
  const encoder = makeTextEncoder(plaintext);
  const text = () => plaintext;
  return Object.freeze({ ...encoder, text });
};

/**
 * @param {BufferSource} buffer
 * @returns {string}
 */
const makeStringFromBytes = (buffer) => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};

/**
 * @param {ArrayBuffer} buffer
 * @returns {Plaintext}
 */
const makePlaintextFromBytes = (buffer) => {
  return makePlaintext(makeStringFromBytes(buffer));
};

/**
 * @param {ArrayBuffer} buffer
 * @returns {Ciphertext}
 */
const makeCiphertext = (buffer) => {
  return Object.freeze({
    buffer: () => buffer,
  });
};

/**
 * @param {number} length
 * @returns {Uint8Array}
 */
const makeRandomBytes = (length) => {
  return window.crypto.getRandomValues(new Uint8Array(length));
};

export const makeSalt = () => makeRandomBytes(16);
export const makeInitVec = () => makeRandomBytes(12);

/**
 * @typedef {{
 *   generateKey: (algorithm: HmacKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]) => Promise<CryptoKey>
 * }} HasGenerateKey
 *
 * @typedef {{
 *   importKey: (format: "jwk", keyData: JsonWebKey, algorithm: HmacImportParams, extractable: boolean, keyUsages: KeyUsage[]) => Promise<CryptoKey>
 * }} HasImportKey
 *
 * @typedef {{
 *   exportKey: (format: "jwk", key: CryptoKey) => Promise<JsonWebKey>
 * }} HasExportKey
 *
 * @typedef {HasGenerateKey & HasImportKey & HasExportKey} HasCrypto
 *
 * @typedef {{ getItem: (key: string) => string | null }} HasGetItem
 * @typedef {{ setItem: (key: string, value: string) => void }} HasSetItem
 * @typedef {HasGetItem & HasSetItem} HasStorage
 */

/** @type {(subtle: HasCrypto, storage: HasStorage) => Promise<CryptoKey>} */
export const makeKey = async (
  subtle = {
    generateKey: window.crypto.subtle.generateKey,
    importKey: window.crypto.subtle.importKey,
    exportKey: window.crypto.subtle.exportKey,
  },
  storage = {
    getItem: localStorage.getItem,
    setItem: localStorage.setItem,
  },
) => {
  /** @type {HmacKeyGenParams} */
  const hmacParams = { name: 'HMAC', hash: { name: 'SHA-256' } };
  /** @type {KeyUsage[]} */
  const keyUsages = ['sign', 'verify'];
  const storageFormat = 'jwk';
  const storageKey = 'key';
  let key;
  let item = storage.getItem(storageKey);
  if (!item) {
    key = await subtle.generateKey(hmacParams, true, keyUsages);
    const exported = await subtle.exportKey(storageFormat, key);
    storage.setItem(storageKey, JSON.stringify(exported));
  } else {
    const imported = JSON.parse(item);
    key = await subtle.importKey(
      storageFormat,
      imported,
      hmacParams,
      true,
      keyUsages,
    );
  }
  return key;
};

/**
 * @type {Object} SaltState
 * @property {string} salt
 * @property {string} signature
 */

/**
 * @type {Object} InitVecState
 * @property {string} initVec
 * @property {string} signature
 */

/**
 * @type {Object} State
 * @property {SaltState} salt
 * @property {InitVecState} initVec
 */

/**
 * @typedef {{ verify: (key: CryptoKey) => Promise<boolean> }} HasVerify
 * @typedef {HasVerify & { salt: () => Uint8Array }} HasSalt
 * @typedef {HasVerify & { iv: () => Uint8Array }} HasInitVec
 * @typedef {HasSalt & HasInitVec} HasState
 */

export const makeState = () => {
  /** @type {(salt?: Uint8Array) => string} */
  const makeSaltString = (salt = makeSalt()) => {
    return makeStringFromBytes(salt);
  };
  /** @type {(iv?: Uint8Array) => string} */
  const makeIVString = (iv = makeInitVec()) => {
    return makeStringFromBytes(iv);
  };
  if (!window.localStorage.salt) {
    window.localStorage.salt = makeSaltString();
  }
  if (!window.localStorage.iv) {
    window.localStorage.iv = makeIVString();
  }
  const saltEncoder = makeTextEncoder(window.localStorage.salt);
  const ivEncoder = makeTextEncoder(window.localStorage.iv);
  return Object.freeze({ salt: saltEncoder.encode, iv: ivEncoder.encode });
};

/**
 * Encrypts a Plaintext
 *
 * @param {Password} password
 * @param {HasEncode} plaintext
 * @param {Uint8Array} salt
 * @param {Uint8Array} iv
 * @returns {Promise<{ ciphertext: Ciphertext, salt: Uint8Array, iv: Uint8Array }>}
 */
export const encrypt = async (
  password,
  plaintext,
  salt = makeSalt(),
  iv = makeInitVec(),
) => {
  const key = await password.generateKey(salt);
  const buffer = await window.crypto.subtle.encrypt(
    { name: ALGO_NAME, iv },
    key,
    plaintext.encode(),
  );
  const ciphertext = makeCiphertext(buffer);
  return { ciphertext, salt, iv };
};

/**
 * Decrypts a Ciphertext
 *
 * @param {Password} password
 * @param {HasBuffer} ciphertext
 * @param {Uint8Array} salt
 * @param {Uint8Array} iv
 * @returns {Promise<Plaintext>}
 */
export const decrypt = async (password, ciphertext, salt, iv) => {
  const key = await password.generateKey(salt);
  return window.crypto.subtle
    .decrypt({ name: ALGO_NAME, iv }, key, ciphertext.buffer())
    .then(makePlaintextFromBytes);
};
