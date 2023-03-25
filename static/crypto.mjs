// @ts-check

import { makeLazy } from './prelude.mjs';

/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array} TypedArray
 * @typedef {ArrayBuffer | TypedArray | DataView} Salt
 * @typedef {ArrayBuffer | TypedArray | DataView} InitVec
 *
 * @typedef {{ encode: () => Uint8Array }} HasEncode
 *
 * @typedef {{ buffer: () => ArrayBuffer }} HasBuffer
 *
 * @typedef {{ text: () => string }} HasText
 *
 * @typedef {HasText & {
 *   generateKey: (salt: Salt) => Promise<CryptoKey>
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
  return Object.freeze({
    encode: makeLazy(text, (t) => {
      const encoder = new TextEncoder();
      return encoder.encode(t);
    }),
  });
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
 * @param {string} text
 * @returns {Password}
 */
export const makePassword = (text) => {
  const encoder = makeTextEncoder(text);
  return Object.freeze({
    text: () => text,
    generateKey: async (/** @type {Salt} */ salt) => {
      const keyMaterial = await generateKeyMaterial(encoder);
      return window.crypto.subtle.deriveKey(
        { name: KEY_DERIVATION_FN, salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: ALGO_NAME, length: 256 },
        true,
        ['encrypt', 'decrypt'],
      );
    },
  });
};

/**
 * @param {string} text
 * @returns {Plaintext}
 */
export const makePlaintext = (text) => {
  const encoder = makeTextEncoder(text);
  return Object.freeze({
    ...encoder,
    text: () => text,
  });
};

/**
 * @param {ArrayBuffer} buffer
 * @returns {Plaintext}
 */
const makePlaintextFromBytes = (buffer) => {
  const decoder = new TextDecoder();
  return makePlaintext(decoder.decode(buffer));
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

export const makeSalt = () => {
  return window.crypto.getRandomValues(new Uint8Array(16));
};

export const makeIV = () => {
  return window.crypto.getRandomValues(new Uint8Array(12));
};

/**
 * Encrypts a Plaintext
 *
 * @param {Password} password
 * @param {HasEncode} plaintext
 * @param {Salt} salt
 * @param {InitVec} iv
 * @returns {Promise<{ ciphertext: Ciphertext, salt: Salt, iv: InitVec }>}
 */
export const encrypt = async (
  password,
  plaintext,
  salt = makeSalt(),
  iv = makeIV(),
) => {
  const key = await password.generateKey(salt);
  const buffer = await window.crypto.subtle.encrypt(
    { name: ALGO_NAME, iv },
    key,
    plaintext.encode(),
  );
  return { ciphertext: makeCiphertext(buffer), salt, iv };
};

/**
 * Decrypts a Ciphertext
 *
 * @param {Password} password
 * @param {HasBuffer} ciphertext
 * @param {Salt} salt
 * @param {InitVec} iv
 * @returns {Promise<Plaintext>}
 */
export const decrypt = async (password, ciphertext, salt, iv) => {
  const key = await password.generateKey(salt);
  return window.crypto.subtle
    .decrypt({ name: ALGO_NAME, iv }, key, ciphertext.buffer())
    .then(makePlaintextFromBytes);
};
