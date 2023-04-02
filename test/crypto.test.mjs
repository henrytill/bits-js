// @ts-check

import { expect } from '@esm-bundle/chai';
import {
  makeKey,
  makePassword,
  makePlaintext,
  makeSalt,
  makeUUIDGenerator,
  encrypt,
  decrypt,
} from '../static/crypto.mjs';

if (window.isSecureContext) {
  console.log('This is a secure context.');
} else {
  console.warn('This is an insecure context.');
}

const SHOULD_CONSTRUCT =
  'should construct an object whose underlying text is the same as the text that was passed as an argument';

const text = 'A moving stream of information';

describe('makePassword()', function () {
  it(SHOULD_CONSTRUCT, function () {
    const password = makePassword(text);
    expect(text).to.equal(password.text());
  });

  it('should deterministically create keys', async function () {
    const a = makePassword('abc123');
    const b = makePassword('abc123');
    const salt = makeSalt();
    const aKey = await a.generateKey(salt);
    const bKey = await b.generateKey(salt);
    expect(aKey).to.deep.equal(bKey);
  });
});

describe('makePlaintext()', function () {
  it(SHOULD_CONSTRUCT, function () {
    const plaintext = makePlaintext(text);
    expect(text).to.equal(plaintext.text());
  });
});

describe('encrypt()', function () {
  it('should round-trip', async function () {
    const expected = makePlaintext(text);
    const password = makePassword('abc123');
    const { ciphertext, salt, iv } = await encrypt(password, expected);
    const actual = await decrypt(password, ciphertext, salt, iv);
    expect(expected.text()).to.equal(actual.text());
  });

  it('should decrypt with a duplicate password', async function () {
    const expected = makePlaintext(text);
    const passwordEncrypt = makePassword('abc123');
    const { ciphertext, salt, iv } = await encrypt(passwordEncrypt, expected);
    const passwordDecrypt = makePassword('abc123');
    const actual = await decrypt(passwordDecrypt, ciphertext, salt, iv);
    expect(expected.text()).to.equal(actual.text());
  });
});

describe('makeKey()', function () {
  /** @type {string} */
  let storageKey = 'testKey';

  /** @type {Promise<CryptoKey>} */
  let promise;

  /** @type {CryptoKey} */
  let key;

  it('should generate a Promise', function () {
    promise = makeKey(storageKey);
    expect(promise).to.be.an.instanceOf(Promise);
  });

  it('should resolve to a CryptoKey', async function () {
    key = await promise;
    expect(key).to.be.an.instanceOf(CryptoKey);
  });

  it('should fetch an existing key from localStorage', async function () {
    const otherKey = await makeKey(storageKey);
    expect(key).to.deep.equal(otherKey);
  });

  after(function () {
    localStorage.removeItem(storageKey);
  });
});

describe('makeUUIDGenerator()', function () {
  /** @type {import('../static/crypto.mjs').UUIDGenerator} */
  let generator;

  it('should generate a UUIDGenerator', function () {
    generator = makeUUIDGenerator();
    expect(generator).to.be.an.instanceOf(Object);
    expect(generator.generate).to.be.an.instanceOf(Function);
  });
});

describe('UUIDGenerator', function () {
  describe('#generate()', function () {
    /** @type {import('../static/crypto.mjs').UUIDGenerator} */
    let generator;

    /** @type {import('../static/crypto.mjs').UUID} */
    let uuid;

    before(function () {
      generator = makeUUIDGenerator();
    });

    it('should generate a UUID', function () {
      uuid = generator.generate();
      expect(uuid).to.be.an.instanceOf(Object);
      expect(uuid.get).to.be.an.instanceOf(Function);
      expect(uuid.get()).to.be.a('string');
    });

    it('should generate a UUID that is 36 characters long', function () {
      expect(uuid.get()).to.have.lengthOf(36);
    });

    it('should generate a UUID that is a valid UUID', function () {
      expect(uuid.get()).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should generate a UUID that is unique', function () {
      const uuids = new Set();
      for (let i = 0; i < 1000; i++) {
        uuids.add(generator.generate().get());
      }
      expect(uuids.size).to.equal(1000);
    });

    it('should generate a UUID that is unique across multiple generators', function () {
      const uuids = new Set();
      for (let i = 0; i < 1000; i++) {
        uuids.add(generator.generate().get());
        uuids.add(makeUUIDGenerator().generate().get());
      }
      expect(uuids.size).to.equal(2000);
    });
  });
});
