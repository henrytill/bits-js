// @ts-check

/**
 * @typedef {string} DatabaseName
 * @typedef {number} DatabaseVersion
 * @typedef {string} ObjectStoreName
 */

/**
 * @typedef {object} Index
 * @property {string} name
 * @property {string | string[] } keyPath
 * @property {IDBIndexParameters} indexParameters
 */

/**
 * @typedef {(db: IDBDatabase) => IDBDatabase} DatabaseModifier
 * @typedef {DatabaseModifier} ObjectStoreCreator
 */

/**
 * @param {ObjectStoreName} objectStoreName
 * @param {IDBObjectStoreParameters} objectStoreParameters
 * @param {Index[]} indices
 * @returns {ObjectStoreCreator}
 * @throws {DOMException}
 */
export const makeObjectStoreCreator = (
  objectStoreName,
  objectStoreParameters,
  indices,
) => {
  return (/** @type {IDBDatabase} */ db) => {
    const objectStore = db.createObjectStore(
      objectStoreName,
      objectStoreParameters,
    );
    indices.forEach(({ name, keyPath, indexParameters }) => {
      objectStore.createIndex(name, keyPath, indexParameters);
    });
    return db;
  };
};

/** @enum {number} */
export const OpenDatabaseResultTag = {
  SUCCESS: 0,
  UPGRADE_NEEDED: 1,
};

/**
 * @typedef {object} OpenDatabaseResult
 * @property {OpenDatabaseResultTag} tag
 * @property {IDBDatabase} db
 */

/**
 * An async wrapper for window.indexedDB.open
 *
 * @param {DatabaseName} dbName
 * @param {DatabaseVersion} dbVersion
 * @param {DatabaseModifier} objectStoreCreator
 * @returns {Promise<OpenDatabaseResult>}
 */
export const openDatabase = (dbName, dbVersion, objectStoreCreator) => {
  return new Promise((resolve, reject) => {
    /** @type {IDBOpenDBRequest} */
    let openRequest;
    try {
      openRequest = window.indexedDB.open(dbName, dbVersion);
      openRequest.onerror = (_) => {
        return reject(openRequest.error);
      };
      openRequest.onsuccess = (_) => {
        return resolve({
          tag: OpenDatabaseResultTag.SUCCESS,
          db: openRequest.result,
        });
      };
      openRequest.onupgradeneeded = (_) => {
        try {
          return resolve({
            tag: OpenDatabaseResultTag.UPGRADE_NEEDED,
            db: objectStoreCreator(openRequest.result),
          });
        } catch (error) {
          if (openRequest.result) {
            openRequest.result.close();
          }
          return reject(error);
        }
      };
    } catch (error) {
      return reject(error);
    }
  });
};

/** @enum {number} */
export const DeleteDatabaseResultTag = {
  SUCCESS: 0,
  BLOCKED: 1,
};

/**
 * @typedef {object} DeleteDatabaseResult
 * @property {DeleteDatabaseResultTag} tag
 */

/**
 * An async wrapper for window.indexedDB.deleteDatabase
 *
 * @param {DatabaseName} dbName
 * @returns {Promise<DeleteDatabaseResult>}
 */
export const deleteDatabase = (dbName) => {
  return new Promise((resolve, reject) => {
    const deleteRequest = window.indexedDB.deleteDatabase(dbName);
    deleteRequest.onerror = (_) => {
      return reject(deleteRequest.error); // is it even possible to hit this?
    };
    deleteRequest.onsuccess = (_) => {
      return resolve({ tag: DeleteDatabaseResultTag.SUCCESS });
    };
    deleteRequest.onblocked = (_) => {
      return resolve({ tag: DeleteDatabaseResultTag.BLOCKED });
    };
  });
};
