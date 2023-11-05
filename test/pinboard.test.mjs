// @ts-check

/* eslint-env node */

import assert from 'node:assert';
import test from 'node:test';

import * as jsdom from 'jsdom';

import { parsePosts } from '../static/pinboard.mjs';
import { PINBOARD_XML } from '../static/pinboard.test.mjs';

const { JSDOM } = jsdom;
const dom = new JSDOM();
let window = dom.window;

test('DOMParser parses Pinboard XML Bookmark Export Format', () => {
  let parser = new window.DOMParser();
  let posts = parsePosts(parser, PINBOARD_XML);
  assert.strictEqual(posts.length, 3);

  assert.deepStrictEqual(
    {
      href: new URL('http://c-faq.com/decl/spiral.anderson.html'),
      time: new Date('2022-05-21T06:26:01Z'),
      description: 'Clockwise/Spiral Rule',
      extended: '',
      tag: ['c', 'c++'],
      hash: '970c1c894ea099f677fbfa18e74e5e31',
      shared: false,
      toread: false,
    },
    posts[0],
  );

  assert.deepStrictEqual(
    {
      href: new URL(
        'https://www.intel.com/content/www/us/en/developer/tools/oneapi/vtune-profiler.html#gs.x8oazh',
      ),
      time: new Date('2022-04-13T13:12:10Z'),
      description: 'Fix Performance Bottlenecks with Intel® VTune™ Profiler',
      extended: '',
      tag: ['performance', 'profiling', 'tools'],
      hash: '2ab1611711c8bb5ed9273b8f4b612fca',
      shared: false,
      toread: false,
    },
    posts[1],
  );

  assert.deepStrictEqual(
    {
      href: new URL('https://docs.microsoft.com/en-us/sysinternals/downloads/procmon'),
      time: new Date('2020-11-24T02:24:59Z'),
      description: 'Process Monitor - Windows Sysinternals | Microsoft Docs',
      extended: 'Monitor file system, Registry, process, thread and DLL activity in real-time.',
      tag: ['windows-dev'],
      hash: 'b87fcc08e549f4076ebeeeaf095482a5',
      shared: false,
      toread: false,
    },
    posts[2],
  );
});
