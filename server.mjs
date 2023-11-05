// @ts-check

/* eslint-env node */

/**
 * Basic development server
 *
 * Adapted from:
 * https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
 */
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';

const PORT = 8000;

/** @type {Record<string, string>} */
const MIME_TYPES = {
  default: 'application/octet-stream',
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript',
  mjs: 'application/javascript',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpg',
  gif: 'image/gif',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const STATIC_PATH = path.join(process.cwd(), './static');

const toBool = [() => true, () => false];

/**
 *
 * @param {http.ServerResponse<http.IncomingMessage>} res
 * @param {fs.WatchEventType} eventType
 * @param {string} filename
 */
const handleChange = (res, eventType, filename) => {
  console.log(`Change detected: ${eventType} ${filename}`);
  res.write(`event: reload\n`);
  res.write(`data: ${JSON.stringify({ eventType, filename })}\n\n`);
  console.log(`Sending reload event for ${filename}`);
};

/**
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse<http.IncomingMessage>} res
 */
const handleEvents = (req, res) => {
  console.log(`SSE connected: ${req.method} ${req.url}`);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  /** @type {fs.WatchListener<string>} */
  const onFileChange = handleChange.bind(null, res);

  // TODO: debounce
  fs.watch(STATIC_PATH, onFileChange);
};

const prepareFile = async (/** @type {string} */ url) => {
  const paths = [STATIC_PATH, url];
  if (url.endsWith('/')) paths.push('index.html');
  const filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  const streamPath = found ? filePath : STATIC_PATH + '/404.html';
  const ext = path.extname(streamPath).substring(1).toLowerCase();
  const stream = fs.createReadStream(streamPath);
  return { found, ext, stream };
};

http
  .createServer(async (req, res) => {
    if (req.url === undefined) {
      const statusCode = 500;
      res.writeHead(statusCode, { 'Content-Type': MIME_TYPES.default });
      res.end('Internal Server Error');
      console.log(`${req.method} ${req.url} ${statusCode}`);
      return;
    }
    if (req.url === '/events') {
      handleEvents(req, res);
      return;
    }
    const urlParts = req.url.split('?');
    const base = urlParts[0];
    const file = await prepareFile(base);
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    const statusCode = file.found ? 200 : 404;
    res.writeHead(statusCode, { 'Content-Type': mimeType });
    file.stream.pipe(res);
    console.log(`${req.method} ${base} ${statusCode}`);
  })
  .listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);
