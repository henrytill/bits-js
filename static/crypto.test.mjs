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
    const aKey = await a.makeKey(salt);
    const bKey = await b.makeKey(salt);
    test.assert(test.deepEquals(aKey, bKey));
  },
);

const makePlaintextShouldConstruct = test.makeTest(
  'makePlaintext() should construct a plaintext',
  () => {
    const plaintext = crypto.makePlaintext(text);
    test.assert(text === plaintext.string());
  },
);

export const tests = [
  makePasswordShouldConstruct,
  makePasswordShouldDeterministicallyGenerate,
  makePlaintextShouldConstruct,
];
