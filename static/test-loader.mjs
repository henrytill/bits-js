/** @type {any} */
let testModule;
/** @type {any} */
let pinboardTestModule;

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
 * @param {boolean} stamp
 * @param {number} timestamp
 * @param {string} path
 * @returns {string}
 */
const makePath = (stamp, timestamp, path) => (stamp ? `${path}?v=${timestamp}` : path);

/**
 * @param {boolean} [stamp]
 * @returns {Promise<void>}
 */
const loadModules = async (stamp = true) => {
  const timestamp = new Date().getTime();
  testModule = await import(makePath(stamp, timestamp, './test.mjs'));
  pinboardTestModule = await import(makePath(stamp, timestamp, './pinboard.test.mjs'));
};

/**
 * @returns {Promise<void>}
 */
const runTests = async () => {
  await Promise.all([
    testModule.runner(pinboardTestModule.tests, document.getElementById('pinboardResults')),
  ]);
};

/**
 * @this {EventSource}
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function reload(event) {
  console.log(event);
  clearResults();
  await loadModules(true);
  return runTests();
}

await loadModules(false);
runTests();

try {
  const eventSource = new EventSource('/events');
  eventSource.addEventListener('reload', reload);
} catch (err) {
  console.log('No /events endpoint found.');
}
