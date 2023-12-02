import { makeLazy } from './prelude.mjs';
import { STORAGE_FNS } from './storage.mjs';

/**
 * An object that can be encoded as a byte array.
 *
 * @typedef {Object} HasEncode
 * @property {() => Uint8Array} encode
 */

/**
 * An object that has an underlying byte buffer.
 *
 * @typedef {Object} HasBuffer
 * @property {() => ArrayBuffer} buffer
 */

/**
 * An object that has a string representation.
 *
 * @typedef {Object} HasString
 * @property {() => string} string
 */

/**
 * An object that can produce a `CryptoKey` from a salt.
 *
 * @typedef {Object} HasMakeKey
 * @property {(salt: Uint8Array) => Promise<CryptoKey>} makeKey
 */

/**
 * @typedef {HasString & HasMakeKey} Password
 * @typedef {HasString & HasEncode} Plaintext
 * @typedef {HasBuffer} Ciphertext
 */

/**
 * @typedef {Object} HasCrypto
 * @property {(algorithm: HmacKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]) => Promise<CryptoKey>} generateKey
 * @property {(format: "jwk", keyData: JsonWebKey, algorithm: HmacImportParams, extractable: boolean, keyUsages: KeyUsage[]) => Promise<CryptoKey>} importKey
 * @property {(format: "jwk", key: CryptoKey) => Promise<JsonWebKey>} exportKey
 */

/**
 * An immutable UUID.
 *
 * @typedef {Object} UUID
 * @property {() => string} get
 */

/**
 * Generates `UUID`s.
 *
 * @typedef {Object} UUIDGenerator
 * @property {() => Readonly<UUID>} generate
 */

/**
 * A function that generates the string representation of a `UUID`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
 * @typedef {() => string} UUIDGeneratorImpl
 */

const KEY_DERIVATION_FN = 'PBKDF2';
const ALGO_NAME = 'AES-GCM';
const STORAGE_KEY = 'key';

/** @type {HasCrypto} */
const SUBTLE_FNS = {
  generateKey: crypto.subtle.generateKey.bind(crypto.subtle),
  importKey: crypto.subtle.importKey.bind(crypto.subtle),
  exportKey: crypto.subtle.exportKey.bind(crypto.subtle),
};

/**
 * Makes an object that lazily encodes a string as UTF-8 bytes.  The bytes are
 * cached, so that subsequent calls to `encode` return the cached value.
 *
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
 * Makes a `Password` from a string.
 *
 * @param {string} password
 * @returns {Password}
 */
export const makePassword = (password) => {
  const string = () => password;
  const encoder = makeTextEncoder(password);
  const makeKey = async (/** @type {Uint8Array} */ salt) => {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(),
      { name: KEY_DERIVATION_FN },
      false,
      ['deriveBits', 'deriveKey'],
    );
    return crypto.subtle.deriveKey(
      { name: KEY_DERIVATION_FN, salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO_NAME, length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  };
  return Object.freeze({ string, makeKey });
};

/**
 * Makes a `Plaintext` from a string.
 *
 * @param {string} plaintext
 * @returns {Plaintext}
 */
export const makePlaintext = (plaintext) => {
  const encoder = makeTextEncoder(plaintext);
  const string = () => plaintext;
  return Object.freeze({ ...encoder, string });
};

/**
 * Decodes a UTF8-encoded buffer into a string.
 *
 * @param {BufferSource} buffer
 * @returns {string}
 */
const decodeBytes = (buffer) => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};

/**
 * Makes a `Plaintext` from a UTF8-encoded buffer.
 *
 * @param {ArrayBuffer} buffer
 * @returns {Plaintext}
 */
const makePlaintextFromBytes = (buffer) => {
  return makePlaintext(decodeBytes(buffer));
};

/**
 * Makes a `Ciphertext` from a buffer.
 *
 * @param {ArrayBuffer} buffer
 * @returns {Ciphertext}
 */
const makeCiphertext = (buffer) => {
  return Object.freeze({ buffer: () => buffer });
};

/**
 * Makes an array of random bytes that is `length`-bytes long.
 *
 * @param {number} length
 * @returns {Uint8Array}
 */
const makeRandomBytes = (length) => {
  return crypto.getRandomValues(new Uint8Array(length));
};

/**
 * Makes a 16-byte salt.
 *
 * @returns {Uint8Array}
 */
export const makeSalt = () => makeRandomBytes(16);

/**
 * Makes a 12-byte initialization vector.
 *
 * @returns {Uint8Array}
 */
export const makeInitVec = () => makeRandomBytes(12);

/**
 * Makes a key for signing and verifying.  On first run, a new key is
 * generated and stored in local storage.  On subsequent runs, the key is
 * retrieved from local storage.
 *
 * @param {string} [storageKey]
 * @param {HasCrypto} [subtle]
 * @param {import('./storage.mjs').HasStorage} [storage]
 * @returns {Promise<CryptoKey>}
 */
export const makeKey = async (
  storageKey = STORAGE_KEY,
  subtle = SUBTLE_FNS,
  storage = STORAGE_FNS,
) => {
  /** @type {HmacKeyGenParams} */
  const hmacParams = { name: 'HMAC', hash: { name: 'SHA-256' } };
  /** @type {KeyUsage[]} */
  const keyUsages = ['sign', 'verify'];
  const storageFormat = 'jwk';
  let key;
  let item = storage.getItem(storageKey);
  if (!item) {
    key = await subtle.generateKey(hmacParams, true, keyUsages);
    const exported = await subtle.exportKey(storageFormat, key);
    storage.setItem(storageKey, JSON.stringify(exported));
  } else {
    const imported = JSON.parse(item);
    key = await subtle.importKey(storageFormat, imported, hmacParams, true, keyUsages);
  }
  return key;
};

/**
 * Encrypts a `Plaintext`.
 *
 * @param {Password} password
 * @param {HasEncode} plaintext
 * @param {Uint8Array} salt
 * @param {Uint8Array} iv
 * @returns {Promise<{ ciphertext: Ciphertext, salt: Uint8Array, iv: Uint8Array }>}
 */
export const encrypt = async (password, plaintext, salt = makeSalt(), iv = makeInitVec()) => {
  const key = await password.makeKey(salt);
  const buffer = await crypto.subtle.encrypt({ name: ALGO_NAME, iv }, key, plaintext.encode());
  const ciphertext = makeCiphertext(buffer);
  return { ciphertext, salt, iv };
};

/**
 * Decrypts a `Ciphertext`.
 *
 * @param {Password} password
 * @param {Ciphertext} ciphertext
 * @param {Uint8Array} salt
 * @param {Uint8Array} iv
 * @returns {Promise<Plaintext>}
 */
export const decrypt = async (password, ciphertext, salt, iv) => {
  const key = await password.makeKey(salt);
  return crypto.subtle
    .decrypt({ name: ALGO_NAME, iv }, key, ciphertext.buffer())
    .then(makePlaintextFromBytes);
};

/**
 * Makes a `UUIDGenerator`.
 *
 * @param {UUIDGeneratorImpl} impl
 * @returns {Readonly<UUIDGenerator>}
 */
export const makeUUIDGenerator = (impl = crypto.randomUUID.bind(crypto)) => {
  /** @type {() => Readonly<UUID>} */
  const generate = () => {
    const uuid = impl();
    const get = () => uuid;
    return Object.freeze({ get });
  };
  return Object.freeze({ generate });
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
    return decodeBytes(salt);
  };
  /** @type {(iv?: Uint8Array) => string} */
  const makeIVString = (iv = makeInitVec()) => {
    return decodeBytes(iv);
  };
  if (!localStorage.salt) {
    localStorage.salt = makeSaltString();
  }
  if (!localStorage.iv) {
    localStorage.iv = makeIVString();
  }
  const saltEncoder = makeTextEncoder(localStorage.salt);
  const ivEncoder = makeTextEncoder(localStorage.iv);
  return Object.freeze({ salt: saltEncoder.encode, iv: ivEncoder.encode });
};
