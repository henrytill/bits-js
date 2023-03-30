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

    it('should return UnknownCaller if a capability is not granted', function () {
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.UnknownCaller);
      expect(requestResult.value).to.be.undefined;
    });

    it('should return UnavailableCapbility if a capability is not available', function () {
      powerbox.grant(CALLER_ID, 'console', console);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.UnavailableCapability);
      expect(requestResult.value).to.be.undefined;
    });

    it('should return the expected object if a capability is granted', function () {
      powerbox.grant(CALLER_ID, CAP_ID, adder);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.Ok);
      maybeGadder = /** @type {Adder | null} */ (requestResult.value);
      expect(maybeGadder).to.not.be.null;
      if (maybeGadder) {
        expect(maybeGadder.add(2, 2)).to.equal(4);
      }
    });

    it('should return RevokedCapability if a capability is revoked', function () {
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.Ok);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.RevokedCapability);
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

    it('should return UnknownCaller if the capability is not granted', function () {
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.UnknownCaller);
    });

    it('should return UnavailableCapability if the capability is not available', function () {
      powerbox.grant(CALLER_ID, 'console', console);
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.UnavailableCapability);
    });

    it('should revoke a capability', function () {
      powerbox.grant(CALLER_ID, CAP_ID, adder);
      const requestResult = powerbox.request(CALLER_ID, CAP_ID);
      expect(requestResult.tag).to.equal(ResultTag.Ok);
      maybeGadder = /** @type {Adder | null} */ (requestResult.value);
      expect(maybeGadder).to.not.be.null;
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.Ok);
      if (maybeGadder) {
        expect(() => /** @type {Adder} */ (maybeGadder).add(2, 2)).to.throw(
          TypeError,
        );
      }
    });

    it('should return RevokedCapability if a capability is revoked', function () {
      const revokeResult = powerbox.revoke(CALLER_ID, CAP_ID);
      expect(revokeResult.tag).to.equal(ResultTag.RevokedCapability);
    });
  });
});
