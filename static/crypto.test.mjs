// @ts-check

import * as crypto from './crypto.mjs';
import * as test from './test.mjs';

const text = 'A moving stream of information';

const makePasswordShouldConstruct = test.makeTest(
  'makePassword() should construct a password',
  () => {
    const password = crypto.makePassword(text);
    test.assert(text === password.string());
  },
);

const makePasswordShouldDeterministicallyGenerate = test.makeTest(
  'makePassword() should deterministically generate keys',
  async () => {
    const a = crypto.makePassword('abc123');
    const b = crypto.makePassword('abc123');
    const salt = crypto.makeSalt();
    const akey = await a.makeKey(salt);
    const bkey = await b.makeKey(salt);
    test.assert(test.deepEquals(akey, bkey));
  },
);

const makePlaintextShouldConstruct = test.makeTest(
  'makePlaintext() should construct a plaintext',
  () => {
    const plaintext = crypto.makePlaintext(text);
    test.assert(text === plaintext.string());
  },
);

const encryptShouldRoundTrip = test.makeTest(
  'encrypt() should round-trip',
  async () => {
    const expected = crypto.makePlaintext(text);
    const password = crypto.makePassword('abc123');
    const { ciphertext, salt, iv } = await crypto.encrypt(password, expected);
    const actual = await crypto.decrypt(password, ciphertext, salt, iv);
    test.assert(expected.string() === actual.string());
  },
);

const encryptShouldDecryptWithADuplicatePassword = test.makeTest(
  'encrypt() should decrypt with a duplicate password',
  async () => {
    const expected = crypto.makePlaintext(text);
    const pwenc = crypto.makePassword('abc123');
    const { ciphertext, salt, iv } = await crypto.encrypt(pwenc, expected);
    const pwdec = crypto.makePassword('abc123');
    const actual = await crypto.decrypt(pwdec, ciphertext, salt, iv);
    test.assert(expected.string() === actual.string());
  },
);

/** @type {string} */
let storageKey = 'testKey';

/** @type {Promise<CryptoKey>} */
let promise;

/** @type {CryptoKey} */
let key;

const makeKeyShouldGenerateAPromise = test.makeTest(
  'makeKey() should generate a promise',
  async () => {
    promise = crypto.makeKey(storageKey);
    test.assert(promise instanceof Promise);
  },
);

const makeKeyShouldResolveToACryptoKey = test.makeTest(
  'makeKey() should resolve to a CryptoKey',
  async () => {
    key = await promise;
    test.assert(key instanceof CryptoKey);
  },
);

const makeKeyShouldFetchAnExistingKey = test.makeTest(
  'makeKey() should fetch an existing key from storage',
  async () => {
    const otherKey = await crypto.makeKey(storageKey);
    test.assert(test.deepEquals(key, otherKey));
    localStorage.removeItem(storageKey);
  },
);

const makeUUIDGeneratorShouldMakeAUUIDGenerator = test.makeTest(
  'makeUUIDGenerator() should make a UUID generator',
  () => {
    const generator = crypto.makeUUIDGenerator();
    test.assert(generator instanceof Object);
    test.assert(generator.generate instanceof Function);
  },
);

const generator = crypto.makeUUIDGenerator();

const uuid = generator.generate();

const uuidMatch =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const uuidGeneratorShouldGenerateUUIDs = test.makeTest(
  'UUIDGenerator#generate should generate UUIDs',
  () => {
    test.assert(uuid instanceof Object);
    test.assert(uuid.get instanceof Function);
    test.assert(typeof uuid.get() === 'string');
    test.assert(uuid.get().length === 36);
    test.assert(uuid.get().match(uuidMatch)?.length === 1);
  },
);

const uuidGeneratorShouldGenerateUniqueUUIDs = test.makeTest(
  'UUIDGenerator#generate should generate unique UUIDs',
  () => {
    const uuids = new Set();
    for (let i = 0; i < 1000; i++) {
      uuids.add(generator.generate().get());
    }
    test.assert(uuids.size === 1000);
  },
);

const uuidGeneratorShouldGenerateUniqueUUIDsAcrossMultipleGenerators =
  test.makeTest(
    'UUIDGenerator#generate should generate unique UUIDs across multiple generators',
    () => {
      const uuids = new Set();
      for (let i = 0; i < 1000; i++) {
        uuids.add(generator.generate().get());
        uuids.add(crypto.makeUUIDGenerator().generate().get());
      }
      test.assert(uuids.size === 2000);
    },
  );

export const tests = [
  makePasswordShouldConstruct,
  makePasswordShouldDeterministicallyGenerate,
  makePlaintextShouldConstruct,
  encryptShouldRoundTrip,
  encryptShouldDecryptWithADuplicatePassword,
  makeKeyShouldGenerateAPromise,
  makeKeyShouldResolveToACryptoKey,
  makeKeyShouldFetchAnExistingKey,
  makeUUIDGeneratorShouldMakeAUUIDGenerator,
  uuidGeneratorShouldGenerateUUIDs,
  uuidGeneratorShouldGenerateUniqueUUIDs,
  uuidGeneratorShouldGenerateUniqueUUIDsAcrossMultipleGenerators,
];
