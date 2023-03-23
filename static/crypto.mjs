// @ts-check

/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array} TypedArray
 * @typedef {ArrayBuffer | TypedArray | DataView} Salt
 * @typedef {ArrayBuffer | TypedArray | DataView} InitVec
 */

const KEY_DERIVATION_FN = 'PBKDF2';
const ALGO_NAME = 'AES-GCM';

class EndecableText {
  /**
   * @param {string} text
   */
  constructor(text) {
    this.text = text;
  }

  /**
   * @param {ArrayBuffer} bytes
   * @returns {EndecableText}
   */
  static decode(bytes) {
    const decoder = new TextDecoder();
    return new this(decoder.decode(bytes));
  }

  /**
   * @returns {ArrayBuffer}
   */
  encode() {
    const encoder = new TextEncoder();
    return encoder.encode(this.text);
  }
}

export class Password extends EndecableText {
  /**
   * Constructs a new Password
   *
   * @param {string} text
   */
  constructor(text) {
    super(text);
  }

  /**
   * Generates a CryptoKey
   *
   * @param {Salt} salt
   * @returns {Promise<CryptoKey>}
   */
  async generateKey(salt) {
    const keyMaterial = await generateKeyMaterial(this);
    return window.crypto.subtle.deriveKey(
      { name: KEY_DERIVATION_FN, salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO_NAME, length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }
}

/**
 * Generates key material from a password
 *
 * @param {Password} password
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

export class Plaintext extends EndecableText {
  /**
   * Creates an instance of Plaintext
   *
   * @param {string} text
   */
  constructor(text) {
    super(text);
  }
}

export class Ciphertext {
  /**
   * Constructs a new Ciphertext
   *
   * @param {ArrayBuffer} bytes
   */
  constructor(bytes) {
    this.bytes = bytes;
  }
}

/**
 * Encrypts a Plaintext
 *
 * @param {Password} password
 * @param {Plaintext} plaintext
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
  return { ciphertext: new Ciphertext(bytes), salt, iv };
}

/**
 * Decrypts a Ciphertext
 *
 * @param {Password} password
 * @param {Ciphertext} ciphertext
 * @param {Salt} salt
 * @param {InitVec} iv
 * @returns {Promise<Plaintext>}
 */
export async function decrypt(password, ciphertext, salt, iv) {
  const key = await password.generateKey(salt);
  return window.crypto.subtle
    .decrypt({ name: ALGO_NAME, iv }, key, ciphertext.bytes)
    .then(bytes => Plaintext.decode(bytes));
}
