/**
 * A `Powerbox` is a mechanism for granting and revoking capabilities to callers.
 *
 * @typedef {Object} Powerbox
 * @property {(callerId: string, capId: string) => RequestResult} request - Requests a capability from the powerbox.
 * @property {(callerId: string, capId: string, object: Object) => void} grant - Grants a capability to a caller.
 * @property {(callerId: string, capId: string) => RevokeResult} revoke - Revokes a capability from a caller.
 */

/**
 * An `Object` returned by `Proxy.revocable`.
 *
 * @typedef {Object} RevocableProxy
 * @property {Object} proxy
 * @property {() => void} revoke
 */

/**
 * A `RevocableProxy` that is enriched with a boolean flag indicating whether it has been revoked.
 *
 * @typedef {RevocableProxy & { isRevoked: boolean}} Capability
 */

/**
 * Represents a caller of a `Powerbox`. A caller has a unique ID and a set of capabilities.
 *
 * @typedef {Object} Caller
 * @property {string} id - The ID of the caller.
 * @property {Record<string, Capability>} caps - The capabilities granted to the caller.
 */

/** @enum {number} */
export const ResultTag = {
    OK: 0,
    UNKNOWN_CALLER: 1,
    UNAVAILABLE_CAPABILITY: 2,
    REVOKED_CAPABILITY: 3,
};

/**
 * A tagged union representing the result of a request for a capability.
 *
 * @typedef {Object} RequestResult
 * @property {ResultTag} tag
 * @property {Object | null} value
 */

/**
 * A tagged union representing the result of revoking a capability.
 *
 * @typedef {Object} RevokeResult
 * @property {ResultTag} tag
 */

/**
 * Makes a `Powerbox`.
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
            return { tag: ResultTag.UNKNOWN_CALLER, value: null };
        }
        const cap = caller.caps[capId];
        if (!cap) {
            return { tag: ResultTag.UNAVAILABLE_CAPABILITY, value: null };
        } else if (cap.isRevoked) {
            return { tag: ResultTag.REVOKED_CAPABILITY, value: cap.proxy };
        } else {
            return { tag: ResultTag.OK, value: cap.proxy };
        }
    };

    /**
     * @param {string} callerId
     * @param {string} capId
     * @param {Object} object
     */
    const grant = (callerId, capId, object) => {
        const proxy = Proxy.revocable(object, {
            get: Reflect.get,
            apply: Reflect.apply,
        });
        const cap = { ...proxy, isRevoked: false };
        const caller = callers.find((c) => c.id === callerId);
        if (!caller) {
            callers.push({
                id: callerId,
                caps: { [capId]: cap },
            });
        } else {
            caller.caps[capId] = cap;
        }
    };

    /**
     * @param {string} callerId
     * @param {string} capId
     * @returns {RevokeResult}
     */
    const revoke = (callerId, capId) => {
        const caller = callers.find((c) => c.id === callerId);
        if (!caller) {
            return { tag: ResultTag.UNKNOWN_CALLER };
        }
        const cap = caller.caps[capId];
        if (!cap) {
            return { tag: ResultTag.UNAVAILABLE_CAPABILITY };
        } else if (cap.isRevoked) {
            return { tag: ResultTag.REVOKED_CAPABILITY };
        } else {
            cap.revoke();
            cap.isRevoked = true;
            return { tag: ResultTag.OK };
        }
    };

    return Object.freeze({ request, grant, revoke });
};
