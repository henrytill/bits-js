// @ts-check

import { Password, Plaintext, encrypt, decrypt } from "./crypto.mjs";

if (window.isSecureContext) {
  console.log("This is a secure context.");
} else {
  console.warn("This is an insecure context.");
}

describe("encrypt()", function () {
  it("should round-trip", async function () {
    const message = "A moving stream of information";
    const expected = new Plaintext(message);
    chai.assert.equal(message, expected.text);
    const password = new Password("abc123");
    const { ciphertext, salt, iv } = await encrypt(password, expected);
    const actual = await decrypt(password, ciphertext, salt, iv);
    chai.assert.equal(message, actual.text);
    chai.assert.deepEqual(expected, actual);
  });
});
