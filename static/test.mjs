// @ts-check

import { encrypt, decrypt } from "./crypto.mjs";

if (window.isSecureContext) {
  console.log("This is a secure context.");
} else {
  console.warn("This is an insecure context.");
}

describe("encrypt()", function () {
  it("should round-trip", async function () {
    let expected = "A moving stream of information";
    let password = "abc123";
    let { ciphertext, salt, iv } = await encrypt(password, expected);
    let actual = await decrypt(password, ciphertext, salt, iv);
    chai.assert.equal(expected, actual);
  });
});
