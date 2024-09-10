import * as prelude from './prelude.mjs';

/** @typedef {import('./test.mjs')} TestModule */
/** @typedef {import('./pinboard.test.mjs')} PinboardTestModule*/

/**
 * @param {boolean} [stamp]
 * @returns {Promise<{test: TestModule , pinboardTest: PinboardTestModule}>}
 */
const loadModules = async (stamp = false) => {
  const timestamp = new Date().getTime();
  const test = await import(prelude.dynamicPath('./test.mjs', stamp, timestamp));
  const pinboardTest = await import(prelude.dynamicPath('./pinboard.test.mjs', stamp, timestamp));
  return { test, pinboardTest };
};

/**
 * @returns {void}
 */
const clearResults = () => {
  const pinboardResultsDiv = document.getElementById('pinboardResults');
  if (!pinboardResultsDiv) {
    throw new Error('pinboardResultsDiv not found');
  }
  pinboardResultsDiv.innerHTML = '';
};

/**
 * @param {boolean} [stamp]
 * @returns {Promise<void>}
 */
const runTests = async (stamp) => {
  const { test, pinboardTest } = await loadModules(stamp);
  const resultsDiv = document.getElementById('pinboardResults');
  if (resultsDiv === null) {
    return Promise.reject('resultsDiv was null');
  }
  await Promise.all([test.run(pinboardTest.tests, resultsDiv)]);
};

/**
 * @this {EventSource}
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function reload(event) {
  console.log(event);
  clearResults();
  return runTests(true);
}

/**
 *
 * @param {string} [url]
 * @returns {Promise<void>}
 */
async function init(url = '/events') {
  await runTests();
  const eventSource = new EventSource(url);
  window.addEventListener('beforeunload', () => eventSource.close());
  eventSource.addEventListener('reload', reload);
}

init();
