// @ts-check

/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array} TypedArray
 * @typedef {ArrayBuffer | TypedArray | DataView} Salt
 * @typedef {ArrayBuffer | TypedArray | DataView} InitVec
 *
 * @typedef {{ encode: function(): ArrayBuffer }} HasEncode
 * @typedef {{ bytes: function(): ArrayBuffer }} HasBytes
 * @typedef {{ text: function(): string }} HasText
 *
 * @typedef {Object & HasText & { generateKey: function(Salt): Promise<CryptoKey> }} Password
 * @typedef {Object & HasText & HasEncode & { decode: function(ArrayBuffer): Plaintext }} Plaintext
 * @typedef {Object & HasBytes} Ciphertext
 */

/**
 * @template T
 * @typedef {Object} TextCodec
 * @prop {function(ArrayBuffer): T} decode
 * @prop {function(): ArrayBuffer} encode
 */

const KEY_DERIVATION_FN = 'PBKDF2';
const ALGO_NAME = 'AES-GCM';

/**
 * @template T
 * @param {string} text
 * @param {function(string): T} ctor
 * @returns {TextCodec<T>}
 */
function makeTextCodec(text = '', ctor) {
  return {
    decode: bytes => {
      const decoder = new TextDecoder();
      return ctor(decoder.decode(bytes));
    },
    encode: () => {
      const encoder = new TextEncoder();
      return encoder.encode(text);
    },
  };
}

/**
 * @param {string} text
 * @returns {Password}
 */
export function makePassword(text = '') {
  let textCodec = makeTextCodec(text, makePassword);
  return {
    text: () => text,
    generateKey: async salt => {
      const keyMaterial = await generateKeyMaterial(textCodec);
      return window.crypto.subtle.deriveKey(
        { name: KEY_DERIVATION_FN, salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: ALGO_NAME, length: 256 },
        true,
        ['encrypt', 'decrypt'],
      );
    },
  };
}

/**
 * Generates key material from a password
 *
 * @param {HasEncode} password
 * @returns {Promise<CryptoKey>}
 */
function generateKeyMaterial(password) {
  return window.crypto.subtle.importKey(
    'raw',
    password.encode(),
    { name: KEY_DERIVATION_FN },
    false,
    ['deriveBits', 'deriveKey'],
  );
}

/**
 * @param {string} text
 * @returns {Plaintext}
 */
export function makePlaintext(text = '') {
  let textCodec = makeTextCodec(text, makePlaintext);
  return {
    ...textCodec,
    text: () => text,
  };
}

/**
 * @param {ArrayBuffer} bytes
 * @returns {Ciphertext}
 */
function makeCiphertext(bytes) {
  return {
    bytes: () => bytes,
  };
}

/**
 * Encrypts a Plaintext
 *
 * @param {Password} password
 * @param {HasEncode} plaintext
 * @param {Salt} salt
 * @param {InitVec} iv
 * @returns {Promise<{ ciphertext: Ciphertext, salt: Salt, iv: InitVec }>}
 */
export async function encrypt(
  password,
  plaintext,
  salt = window.crypto.getRandomValues(new Uint8Array(16)),
  iv = window.crypto.getRandomValues(new Uint8Array(12)),
) {
  const key = await password.generateKey(salt);
  const bytes = await window.crypto.subtle.encrypt(
    { name: ALGO_NAME, iv },
    key,
    plaintext.encode(),
  );
  return { ciphertext: makeCiphertext(bytes), salt, iv };
}

/**
 * Decrypts a Ciphertext
 *
 * @param {Password} password
 * @param {HasBytes} ciphertext
 * @param {Salt} salt
 * @param {InitVec} iv
 * @returns {Promise<Plaintext>}
 */
export async function decrypt(password, ciphertext, salt, iv) {
  const key = await password.generateKey(salt);
  return window.crypto.subtle
    .decrypt({ name: ALGO_NAME, iv }, key, ciphertext.bytes())
    .then(bytes => makePlaintext().decode(bytes));
}
