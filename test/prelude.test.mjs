// @ts-check

import { expect } from '@esm-bundle/chai';
import { match } from '../static/prelude.mjs';

/**
 * @typedef {import('../static/prelude.mjs').HasTag} HasTag
 */

/**
 * @typedef {HasTag & { radius: number }} Circle
 * @typedef {HasTag & { width: number, height: number }} Rectangle
 * @typedef {HasTag & { base: number, height: number }} Triangle
 * @typedef {Circle | Rectangle | Triangle} Shape
 */

describe('match()', () => {
  /** @type {Shape[]} */
  const shapes = [
    { tag: 'circle', radius: 5 },
    { tag: 'rectangle', width: 10, height: 20 },
    { tag: 'triangle', base: 5, height: 10 },
  ];

  const area = match({
    circle: ({ radius }) => (Math.PI * radius) ** 2,
    rectangle: ({ width, height }) => width * height,
    triangle: ({ base, height }) => (base * height) / 2,
    _: () => 0,
  });

  it('should correctly apply patterns based on the tag property', () => {
    expect(area(shapes[0])).to.equal((Math.PI * 5) ** 2);
    expect(area(shapes[1])).to.equal(10 * 20);
    expect(area(shapes[2])).to.equal((5 * 10) / 2);
  });

  it('should apply the default pattern when no matching tag is found', () => {
    expect(area({ tag: 'unknown' })).to.equal(0);
  });

  it('should throw an error if no matching pattern and no default pattern are provided', () => {
    const shapes = [
      { tag: 'circle', radius: 5 },
      { tag: 'unknown', width: 10, height: 20 },
    ];

    const area = match({
      circle: ({ radius }) => 2 * Math.PI * radius,
    });

    expect(() => area(shapes[1])).to.throw(
      Error,
      'No matching pattern for value: {"tag":"unknown","width":10,"height":20}',
    );
  });
});
