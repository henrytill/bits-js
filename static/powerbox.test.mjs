import * as powerbox from './powerbox.mjs';
import * as test from './test.mjs';

const makePowerboxShouldConstruct = test.makeTest(
  'makePowerbox() should construct a Powerbox',
  () => {
    const pb = powerbox.makePowerbox();
    test.assert(pb.hasOwnProperty('request'));
    test.assert(pb.hasOwnProperty('grant'));
    test.assert(pb.hasOwnProperty('revoke'));
  },
);

/** @typedef {{ add: (a: number, b: number) => number }} Adder*/

/** @type Adder */
const adder = {
  add: (a, b) => a + b,
};

const CALLER_ID = 'caller';
const CAP_ID = 'adder';

const pbReq = powerbox.makePowerbox();

const requestShouldReturnUnknownCaller = test.makeTest(
  'request() should return UnknownCaller if the caller has not been granted any capabilities',
  () => {
    const requestResult = pbReq.request(CALLER_ID, CAP_ID);
    test.assert(requestResult.tag === powerbox.ResultTag.UNKNOWN_CALLER);
    test.assert(requestResult.value === null);
  },
);

const requestShouldReturnUnavailableCapability = test.makeTest(
  'request() should return UnavailableCapability if the capability has not been granted',
  () => {
    pbReq.grant(CALLER_ID, 'console', console);
    const requestResult = pbReq.request(CALLER_ID, CAP_ID);
    test.assert(
      requestResult.tag === powerbox.ResultTag.UNAVAILABLE_CAPABILITY,
    );
    test.assert(requestResult.value === null);
  },
);

const requestShouldReturnTheExpectedObjectIfTheCapabilityHasBeenGranted =
  test.makeTest(
    'request() should return the expected object if the capability has been granted',
    () => {
      pbReq.grant(CALLER_ID, CAP_ID, adder);
      const requestResult = pbReq.request(CALLER_ID, CAP_ID);
      test.assert(requestResult.tag === powerbox.ResultTag.OK);
      const maybeGadder = /** @type {Adder | null} */ (requestResult.value);
      test.assert(maybeGadder !== null);
      if (maybeGadder) {
        test.assert(maybeGadder.add(2, 2) === 4);
      }
    },
  );

const requestShouldReturnRevokedCapability = test.makeTest(
  'request() should return RevokedCapability if the capability has been revoked',
  () => {
    const revokeResult = pbReq.revoke(CALLER_ID, CAP_ID);
    test.assert(revokeResult.tag === powerbox.ResultTag.OK);
    const requestResult = pbReq.request(CALLER_ID, CAP_ID);
    test.assert(requestResult.tag === powerbox.ResultTag.REVOKED_CAPABILITY);
    const maybeGadder = /** @type {Adder | null} */ (requestResult.value);
    test.assert(maybeGadder !== null);
    if (maybeGadder) {
      test.assertThrows(
        () => maybeGadder.add(2, 2),
        TypeError,
        'illegal operation attempted on a revoked proxy',
      );
    }
  },
);

const pbRev = powerbox.makePowerbox();

const revokeShouldReturnUnknownCaller = test.makeTest(
  'revoke() should return UnknownCaller if the caller has not been granted any capabilities',
  () => {
    const revokeResult = pbRev.revoke(CALLER_ID, CAP_ID);
    test.assert(revokeResult.tag === powerbox.ResultTag.UNKNOWN_CALLER);
  },
);

const revokeShouldReturnUnavailableCapability = test.makeTest(
  'revoke() should return UnavailableCapability if the capability has not been granted',
  () => {
    pbRev.grant(CALLER_ID, 'console', console);
    const revokeResult = pbRev.revoke(CALLER_ID, CAP_ID);
    test.assert(revokeResult.tag === powerbox.ResultTag.UNAVAILABLE_CAPABILITY);
  },
);

const revokeShouldRevokeACapability = test.makeTest(
  'revoke() should revoke a capability',
  () => {
    pbRev.grant(CALLER_ID, CAP_ID, adder);
    const requestResult = pbRev.request(CALLER_ID, CAP_ID);
    test.assert(requestResult.tag === powerbox.ResultTag.OK);
    const maybeGadder = /** @type {Adder | null} */ (requestResult.value);
    test.assert(maybeGadder !== null);
    const revokeResult = pbRev.revoke(CALLER_ID, CAP_ID);
    test.assert(revokeResult.tag === powerbox.ResultTag.OK);
    if (maybeGadder) {
      test.assertThrows(
        () => maybeGadder.add(2, 2),
        TypeError,
        'illegal operation attempted on a revoked proxy',
      );
    }
  },
);

const revokeShouldReturnRevokedCapability = test.makeTest(
  'revoke() should return RevokedCapability if the capability has been revoked',
  () => {
    const revokeResult = pbRev.revoke(CALLER_ID, CAP_ID);
    test.assert(revokeResult.tag === powerbox.ResultTag.REVOKED_CAPABILITY);
  },
);

export const tests = [
  makePowerboxShouldConstruct,
  requestShouldReturnUnknownCaller,
  requestShouldReturnUnavailableCapability,
  requestShouldReturnTheExpectedObjectIfTheCapabilityHasBeenGranted,
  requestShouldReturnRevokedCapability,
  revokeShouldReturnUnknownCaller,
  revokeShouldReturnUnavailableCapability,
  revokeShouldRevokeACapability,
  revokeShouldReturnRevokedCapability,
];
