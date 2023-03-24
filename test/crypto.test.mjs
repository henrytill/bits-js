// @ts-check

import { expect } from '@esm-bundle/chai';
import {
  makePassword,
  makePlaintext,
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

describe('makePassword()', () => {
  it(SHOULD_CONSTRUCT, () => {
    const text = 'A moving stream of information';
    const password = makePassword(text);
    expect(text).to.equal(password.text());
  });
});

describe('makePlaintext()', () => {
  it(SHOULD_CONSTRUCT, () => {
    const text = 'A moving stream of information';
    const plaintext = makePlaintext(text);
    expect(text).to.equal(plaintext.text());
  });
});

describe('encrypt()', () => {
  it('should round-trip', async () => {
    const message = 'A moving stream of information';
    const expected = makePlaintext(message);
    const password = makePassword('abc123');
    const { ciphertext, salt, iv } = await encrypt(password, expected);
    const actual = await decrypt(password, ciphertext, salt, iv);
    expect(expected.text()).to.equal(actual.text());
  });
});
