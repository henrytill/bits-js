import * as db from './db.mjs';
import * as test from './test.mjs';

/**
 * @typedef {import('./db.mjs').OpenDatabaseResult} OpenDatabaseResult
 * @typedef {import('./db.mjs').DeleteDatabaseResult} DeleteDatabaseResult
 * @typedef {import('./db.mjs').Index} Index
 * @typedef {import('./db.mjs').DatabaseModifier} DatabaseModifier
 * @typedef {import('./db.mjs').DatabaseName} DatabaseName
 */

const dbName = 'openDatabase-test-db';
const dbVersion = 1;
const objectStoreName = 'openDatabase-test-object-store';

/** @type {IDBObjectStoreParameters} */
const objectStoreParameters = {
    keyPath: 'id',
    autoIncrement: true,
};

/** @type {Index[]} */
const indexes = [
    { name: 'name', keyPath: 'name', indexParameters: { unique: false } },
    { name: 'age', keyPath: 'age', indexParameters: { unique: false } },
];

/** @type {DatabaseModifier} */
const objectStoreCreator = db.makeObjectStoreCreator(
    objectStoreName,
    objectStoreParameters,
    indexes,
);

/**
 * @param {DatabaseName} dbName
 * @returns {Promise<void>}
 */
async function deleteDatabase(dbName) {
    let { tag } = await db.deleteDatabase(indexedDB, dbName);
    switch (tag) {
        case db.DeleteDatabaseResultTag.SUCCESS:
            break;
        case db.DeleteDatabaseResultTag.BLOCKED:
            throw new Error('Database deletion blocked');
    }
}

/** @type {Promise<OpenDatabaseResult>} */
let promise;

/** @type {OpenDatabaseResult} */
let result;

const openDatabaseShouldReturnPromise = test.makeTest(
    'openDatabase() should return a Promise',
    async () => {
        promise = db.openDatabase(indexedDB, dbName, dbVersion, objectStoreCreator);
        test.assert(promise instanceof Promise);
        result = await promise;
    },
);

const openDatabaseShouldResolve = test.makeTest(
    'openDatabase() should resolve to need to be upgraded',
    () => {
        test.assert(result.tag === db.OpenDatabaseResultTag.UPGRADE_NEEDED);
    },
);

const resultShouldHaveDatabase = test.makeTest(
    'openDatabase() should resolve to have a database',
    () => {
        test.assert(result.db instanceof IDBDatabase);
    },
);

const openedDatabaseShouldClose = test.makeTest('An opened database should close', () => {
    result.db.close();
});

const deleteDatabaseShouldSucceed = test.makeTest('deleteDatabase() should succeed', async () => {
    await deleteDatabase(dbName);
});

export const tests = [
    openDatabaseShouldReturnPromise,
    openDatabaseShouldResolve,
    resultShouldHaveDatabase,
    openedDatabaseShouldClose,
    deleteDatabaseShouldSucceed,
];
