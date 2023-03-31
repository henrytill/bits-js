// @ts-check

import { expect, use } from '@esm-bundle/chai';
import chaiAsPromised from '@esm-bundle/chai-as-promised';
import * as db from '../static/db.mjs';

use(chaiAsPromised);

/**
 * @typedef {import('../static/db.mjs').OpenDatabaseResult} OpenDatabaseResult
 * @typedef {import('../static/db.mjs').DeleteDatabaseResult} DeleteDatabaseResult
 * @typedef {import('../static/db.mjs').Index} Index
 */

describe('openDatabase()', function () {
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

  /** @type {import('../static/db.mjs').ObjectStoreCreator} */
  const objectStoreCreator = db.makeObjectStoreCreator(
    objectStoreName,
    objectStoreParameters,
    indexes,
  );

  /**
   * @param {import('../static/db.mjs').DatabaseName} dbName
   * @returns {Promise<void>}
   */
  async function deleteDatabase(dbName) {
    let { tag } = await db.deleteDatabase(dbName);
    switch (tag) {
      case db.DeleteDatabaseResultTag.Success:
        break;
      case db.DeleteDatabaseResultTag.Blocked:
        throw new Error('Database deletion blocked');
    }
  }

  after(async function () {
    await deleteDatabase(dbName);
  });

  describe('when called the first time', function () {
    /** @type {Promise<OpenDatabaseResult>} */
    let promise;

    /** @type {OpenDatabaseResult} */
    let result;

    before(function () {
      promise = db.openDatabase(dbName, dbVersion, objectStoreCreator);
    });

    after(function () {
      if (result && result.db) {
        result.db.close();
      }
    });

    it('should return a Promise', function () {
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should resolve to need to be upgraded', async function () {
      result = await promise;
      expect(result.tag).to.equal(db.OpenDatabaseResultTag.UpgradeNeeded);
    });

    it('should resolve to have a db property that is an IDBDatabase instance', function () {
      expect(result.db).to.be.an.instanceof(IDBDatabase);
    });

    it('should resolve to have an underlying object store', function () {
      expect(result.db.objectStoreNames.contains(objectStoreName)).to.be.true;
      expect(result.db.objectStoreNames.length).to.equal(1);
    });
  });

  describe('when called subsequently', function () {
    /** @type {Promise<OpenDatabaseResult>} */
    let promise;

    /** @type {OpenDatabaseResult} */
    let result;

    before(function () {
      promise = db.openDatabase(dbName, dbVersion, objectStoreCreator);
    });

    after(function () {
      if (result && result.db) {
        result.db.close();
      }
    });

    it('should return a Promise', function () {
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should resolve to not need to be upgraded', async function () {
      result = await promise;
      expect(result.tag).to.equal(db.OpenDatabaseResultTag.Success);
    });

    it('should resolve to have a db property that is an IDBDatabase instance', function () {
      expect(result.db).to.be.an.instanceof(IDBDatabase);
    });
  });

  describe('when called with an invalid DatabaseVersion', function () {
    /** @type {Promise<OpenDatabaseResult>} */
    let promise;

    /** @type {OpenDatabaseResult} */
    let result;

    before(function () {
      promise = db.openDatabase(dbName, 0, objectStoreCreator);
    });

    after(function () {
      if (result && result.db) {
        result.db.close();
      }
    });

    it('should return a Promise', function () {
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should reject with an Error', function () {
      expect(promise).to.be.rejectedWith(Error);
    });
  });

  describe('when called with an invalid ObjectStoreCreator', function () {
    /** @type {Promise<OpenDatabaseResult>} */
    let promise;

    /** @type {OpenDatabaseResult} */
    let result;

    before(async function () {
      await deleteDatabase(dbName);
      promise = db.openDatabase(dbName, dbVersion, (db) => db);
    });

    after(function () {
      if (result && result.db) {
        result.db.close();
      }
    });

    it('should return a Promise', function () {
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should resolve to need to be upgraded', async function () {
      result = await promise;
      expect(result.tag).to.equal(db.OpenDatabaseResultTag.UpgradeNeeded);
    });

    it('should resolve to not have an underlying object store', function () {
      expect(result.db.objectStoreNames.contains(objectStoreName)).to.be.false;
      expect(result.db.objectStoreNames.length).to.equal(0);
    });
  });

  describe('when called with an invalid ObjectStoreName', function () {
    /** @type {Promise<OpenDatabaseResult>} */
    let promise;

    /** @type {OpenDatabaseResult} */
    let result;

    /** @type {IDBObjectStoreParameters} */
    const invalidObjectStoreParameters = {
      keyPath: '',
      autoIncrement: true,
    };

    before(async function () {
      await deleteDatabase(dbName);
      promise = db.openDatabase(dbName, dbVersion, (db) => {
        db.createObjectStore(objectStoreName, invalidObjectStoreParameters);
        return db;
      });
    });

    after(function () {
      if (result && result.db) {
        result.db.close();
      }
    });

    it('should return a Promise', function () {
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should reject with an Error', function () {
      expect(promise).to.be.rejectedWith(Error);
    });
  });
});

describe('deleteDatabase', function () {
  const dbName = 'deleteDatabase-test-db';
  const dbVersion = 1;
  const objectStoreName = 'deleteDatabase-test-object-store';

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

  /** @type {import('../static/db.mjs').ObjectStoreCreator} */
  const objectStoreCreator = db.makeObjectStoreCreator(
    objectStoreName,
    objectStoreParameters,
    indexes,
  );

  /** @type {IDBDatabase} */
  let database;

  beforeEach(async function () {
    ({ db: database } = await db.openDatabase(
      dbName,
      dbVersion,
      objectStoreCreator,
    ));
  });

  it('should return a Promise', async function () {
    const promise = db.deleteDatabase(dbName);
    expect(promise).to.be.an.instanceof(Promise);
    database.close();
    await promise;
  });

  it('should resolve to blocked before database is closed', async function () {
    const result = await db.deleteDatabase(dbName);
    expect(result.tag).to.equal(db.DeleteDatabaseResultTag.Blocked);
    database.close();
  });

  it('should resolve to success after database is closed', async function () {
    database.close();
    const result = await db.deleteDatabase(dbName);
    expect(result.tag).to.equal(db.DeleteDatabaseResultTag.Success);
  });
});
