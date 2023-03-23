// @ts-check

import { makePassword, makePlaintext, encrypt, decrypt } from './crypto.mjs';

if (window.isSecureContext) {
  console.log('This is a secure context.');
} else {
  console.warn('This is an insecure context.');
}

const SHOULD_CONSTRUCT =
  'should construct an object whose underlying text is the same as the text that was passed as an argument';

describe('makePassword()', function () {
  it(SHOULD_CONSTRUCT, () => {
    const text = 'A moving stream of information';
    const password = makePassword(text);
    chai.assert.equal(text, password.text());
  });
});

describe('makePlaintext()', function () {
  it(SHOULD_CONSTRUCT, () => {
    const text = 'A moving stream of information';
    const plaintext = makePlaintext(text);
    chai.assert.equal(text, plaintext.text());
  });
});

describe('encrypt()', function () {
  it('should round-trip', async function () {
    const message = 'A moving stream of information';
    const expected = makePlaintext(message);
    const password = makePassword('abc123');
    const { ciphertext, salt, iv } = await encrypt(password, expected);
    const actual = await decrypt(password, ciphertext, salt, iv);
    chai.assert.equal(expected.text(), actual.text());
  });
});
