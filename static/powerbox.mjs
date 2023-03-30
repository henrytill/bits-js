// @ts-check

/**
 * A Powerbox is a mechanism for granting and revoking capabilities to callers.
 *
 * @typedef {Object} Powerbox
 * @property {(callerId: string, capId: string) => RequestResult} request - Requests a capability from the powerbox.
 * @property {(callerId: string, capId: string, object: Object) => void} grant - Grants a capability to a caller.
 * @property {(callerId: string, capId: string) => RevokeResult} revoke - Revokes a capability from a caller.
 */

/**
 * An Object returned by Proxy.revocable
 *
 * @typedef {Object} RevocableProxy
 * @property {Object} proxy
 * @property {() => void} revoke
 */

/**
 * A RevocableProxy that is enriched with a boolean flag indicating whether it has been revoked.
 *
 * @typedef {RevocableProxy & { isRevoked: boolean}} Capability
 */

/**
 * Represents a caller of a Powerbox. A caller has a unique ID and a set of capabilities.
 *
 * @typedef {Object} Caller
 * @property {string} id - The ID of the caller.
 * @property {Record<string, Capability>} caps - The capabilities granted to the caller.
 */

/** @enum {number} */
export const ResultTag = {
  Ok: 0,
  UnknownCaller: 1,
  UnavailableCapability: 2,
  RevokedCapability: 3,
};

/**
 * A tagged union representing the result of a request for a capability.
 *
 * @typedef {Object} RequestResult
 * @property {ResultTag} tag
 * @property {Object} [value]
 */

/**
 * A tagged union representing the result of revoking a capability.
 *
 * @typedef {Object} RevokeResult
 * @property {ResultTag} tag
 */

/**
 * Makes a Powerbox
 *
 * @type {() => Readonly<Powerbox>}
 */
export const makePowerbox = () => {
  /** @type {Caller[]} */
  const callers = [];

  /**
   * @param {string} callerId
   * @param {string} capId
   * @returns {RequestResult}
   */
  const request = (callerId, capId) => {
    const caller = callers.find((c) => c.id === callerId);
    if (!caller) {
      return { tag: ResultTag.UnknownCaller };
    } else if (!caller.caps[capId]) {
      return { tag: ResultTag.UnavailableCapability };
    }
    const cap = caller.caps[capId];
    if (cap.isRevoked) {
      return { tag: ResultTag.RevokedCapability };
    } else {
      return { tag: ResultTag.Ok, value: cap.proxy };
    }
  };

  /**
   * @param {string} callerId
   * @param {string} capId
   * @param {Object} object
   */
  const grant = (callerId, capId, object) => {
    const callerIndex = callers.findIndex((c) => c.id === callerId);
    const proxy = Proxy.revocable(object, {
      get: Reflect.get,
      apply: Reflect.apply,
    });
    const cap = { ...proxy, isRevoked: false };
    if (callerIndex === -1) {
      callers.push({
        id: callerId,
        caps: { [capId]: cap },
      });
    } else {
      callers[callerIndex].caps[capId] = cap;
    }
  };

  /**
   * @param {string} callerId
   * @param {string} capId
   * @returns {RevokeResult}
   */
  const revoke = (callerId, capId) => {
    const callerIndex = callers.findIndex((c) => c.id === callerId);
    if (callerIndex === -1) {
      return { tag: ResultTag.UnknownCaller };
    }
    const cap = callers[callerIndex].caps[capId];
    if (!cap) {
      return { tag: ResultTag.UnavailableCapability };
    } else if (cap.isRevoked) {
      return { tag: ResultTag.RevokedCapability };
    } else {
      cap.revoke();
      cap.isRevoked = true;
      return { tag: ResultTag.Ok };
    }
  };

  return Object.freeze({ request, grant, revoke });
};
