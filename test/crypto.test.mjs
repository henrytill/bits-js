// @ts-check

import { expect } from '@esm-bundle/chai';
import {
  makePassword,
  makePlaintext,
  makeSalt,
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

describe('makePassword()', () => {
  it(SHOULD_CONSTRUCT, () => {
    const password = makePassword(text);
    expect(text).to.equal(password.text());
  });

  it('should deterministically create keys', async () => {
    const a = makePassword('abc123');
    const b = makePassword('abc123');
    const salt = makeSalt();
    const aKey = await a.generateKey(salt);
    const bKey = await b.generateKey(salt);
    expect(aKey).to.deep.equal(bKey);
  });
});

describe('makePlaintext()', () => {
  it(SHOULD_CONSTRUCT, () => {
    const plaintext = makePlaintext(text);
    expect(text).to.equal(plaintext.text());
  });
});

describe('encrypt()', () => {
  it('should round-trip', async () => {
    const expected = makePlaintext(text);
    const password = makePassword('abc123');
    const { ciphertext, salt, iv } = await encrypt(password, expected);
    const actual = await decrypt(password, ciphertext, salt, iv);
    expect(expected.text()).to.equal(actual.text());
  });

  it('should decrypt with a duplicate password', async () => {
    const expected = makePlaintext(text);
    const passwordEncrypt = makePassword('abc123');
    const { ciphertext, salt, iv } = await encrypt(passwordEncrypt, expected);
    const passwordDecrypt = makePassword('abc123');
    const actual = await decrypt(passwordDecrypt, ciphertext, salt, iv);
    expect(expected.text()).to.equal(actual.text());
  });
});
