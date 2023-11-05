// @ts-check

/* eslint-env node */

import test from 'node:test';
import assert from 'node:assert';

import * as prelude from '../static/prelude.mjs';

/**
 * @typedef {import('../static/prelude.mjs').HasTag} HasTag
 */

/**
 * @typedef {HasTag & { radius: number }} Circle
 * @typedef {HasTag & { width: number, height: number }} Rectangle
 * @typedef {HasTag & { base: number, height: number }} Triangle
 * @typedef {Circle | Rectangle | Triangle} Shape
 */

/** @type {Shape[]} */
const shapes = [
  { tag: 'circle', radius: 5 },
  { tag: 'rectangle', width: 10, height: 20 },
  { tag: 'triangle', base: 5, height: 10 },
];

const area = prelude.match({
  circle: ({ radius }) => (Math.PI * radius) ** 2,
  rectangle: ({ width, height }) => width * height,
  triangle: ({ base, height }) => (base * height) / 2,
  _: () => 0,
});

test('match() should correctly apply patterns based on the tag property', (_) => {
  assert.strictEqual(area(shapes[0]), (Math.PI * 5) ** 2);
  assert.strictEqual(area(shapes[1]), 10 * 20);
  assert.strictEqual(area(shapes[2]), (5 * 10) / 2);
});

test('match() should apply the default pattern when no matching tag is found', (_) => {
  assert.strictEqual(area({ tag: 'unknown' }), 0);
});

test('match() should throw an error if no matching pattern and no default pattern are provided', (_) => {
  /** @type {Shape[]} */
  const shapes = [
    { tag: 'circle', radius: 5 },
    { tag: 'unknown', width: 10, height: 20 },
  ];

  const area = prelude.match({
    circle: ({ radius }) => 2 * Math.PI * radius,
  });

  /** @param {any} err */
  const checkError = (err) => {
    assert.ok(err instanceof Error);
    assert.strictEqual(
      err.message,
      'No matching pattern for value: {"tag":"unknown","width":10,"height":20}',
    );
    return true;
  };

  assert.throws(() => area(shapes[1]), checkError);
});
