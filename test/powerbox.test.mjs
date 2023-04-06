// @ts-check

import { expect } from '@esm-bundle/chai';
import { makePowerbox, ResultTag } from '../static/powerbox.mjs';

describe('makePowerbox()', function () {
  it('should construct a powerbox', function () {
    const powerbox = makePowerbox();
    expect(powerbox).to.haveOwnProperty('request');
    expect(powerbox).to.haveOwnProperty('grant');
    expect(powerbox).to.haveOwnProperty('revoke');
  });
});

describe('Powerbox', function () {
  /** @typedef {{ add: (a: number, b: number) => number }} Adder*/

  /** @type Adder */
  const adder = {
    add: (a, b) => a + b,
  };

  const CALLER_ID = 'caller';
  const CAP_ID = 'adder';

  describe('#request()', function () {
    /** @type {import('../static/powerbox.mjs').Powerbox} */
    let powerbox;

    /** @type {Adder | null} */
    let maybeGadder;

    before(function () {
      powerbox = makePowerbox();
    });

    it('should return UnknownCaller if the caller has not been granted any capabilities', function () {
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.UNKNOWN_CALLER);
      expect(requestResult.value).to.be.null;
    });

    it('should return UnavailableCapbility if the capability has not been granted', function () {
      powerbox.grant(CALLER_ID, 'console', console);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.UNAVAILABLE_CAPABILITY);
      expect(requestResult.value).to.be.null;
    });

    it('should return the expected object if the capability has been granted', function () {
      powerbox.grant(CALLER_ID, CAP_ID, adder);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.OK);
      maybeGadder = /** @type {Adder | null} */ (requestResult.value);
      expect(maybeGadder).to.not.be.null;
      if (maybeGadder) {
        expect(maybeGadder.add(2, 2)).to.equal(4);
      }
    });

    it('should return RevokedCapability if the capability has been revoked', function () {
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.OK);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.REVOKED_CAPABILITY);
      maybeGadder = /** @type {Adder | null} */ (requestResult.value);
      expect(maybeGadder).to.not.be.null;
      if (maybeGadder) {
        expect(() => /** @type {Adder} */ (maybeGadder).add(2, 2)).to.throw(
          TypeError,
        );
      }
    });
  });

  describe('#revoke()', function () {
    /** @type {import('../static/powerbox.mjs').Powerbox} */
    let powerbox;

    /** @type {Adder | null} */
    let maybeGadder;

    before(function () {
      powerbox = makePowerbox();
    });

    it('should return UnknownCaller if the caller has not been granted any capabilities', function () {
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.UNKNOWN_CALLER);
    });

    it('should return UnavailableCapability if the capability has not been granted', function () {
      powerbox.grant(CALLER_ID, 'console', console);
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.UNAVAILABLE_CAPABILITY);
    });

    it('should revoke a capability', function () {
      powerbox.grant(CALLER_ID, CAP_ID, adder);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.OK);
      maybeGadder = /** @type {Adder | null} */ (requestResult.value);
      expect(maybeGadder).to.not.be.null;
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.OK);
      if (maybeGadder) {
        expect(() => /** @type {Adder} */ (maybeGadder).add(2, 2)).to.throw(
          TypeError,
        );
      }
    });

    it('should return RevokedCapability if the capability has been revoked', function () {
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.REVOKED_CAPABILITY);
    });
  });
});
