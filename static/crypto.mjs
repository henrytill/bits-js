// @ts-check

/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array} TypedArray
 * @typedef {ArrayBuffer | TypedArray | DataView} Salt
 * @typedef {ArrayBuffer | TypedArray | DataView} InitVec
 */

/**
 * Creates key material from a password
 *
 * @param {string} password - Password
 * @returns {Promise<CryptoKey>} - Key material
 */
function getKeyMaterial(password = "abc123") {
  let encoder = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

/**
 * Creates a crypto key from key material and salt
 *
 * @param {CryptoKey} keyMaterial - Key material
 * @param {Salt} salt - Salt
 * @returns {Promise<CryptoKey>} - Key
 */
function getKey(keyMaterial, salt) {
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext
 *
 * @param {string} plaintext - Plaintext to encrypt
 * @param {Salt} salt - Salt
 * @param {InitVec} iv - Initialization vector
 * @returns {Promise<{ ciphertext: ArrayBuffer, salt: Salt, iv: InitVec }>}
 */
export async function encrypt(
  plaintext,
  salt = window.crypto.getRandomValues(new Uint8Array(16)),
  iv = window.crypto.getRandomValues(new Uint8Array(12))
) {
  let encoder = new TextEncoder();
  let keyMaterial = await getKeyMaterial();
  let key = await getKey(keyMaterial, salt);
  let ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoder.encode(plaintext)
  );
  return { ciphertext, salt, iv };
}

/**
 * Decrypts a ciphertext
 *
 * @param {ArrayBuffer} ciphertext - Ciphertext to decrypt
 * @param {Salt} salt - Salt
 * @param {InitVec} iv - Initialization vector
 * @returns {Promise<string>} - Plaintext
 */
export async function decrypt(ciphertext, salt, iv) {
  let keyMaterial = await getKeyMaterial();
  let key = await getKey(keyMaterial, salt);
  return window.crypto.subtle
    .decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    )
    .then((buffer) => {
      let decoder = new TextDecoder();
      return decoder.decode(buffer);
    });
}
