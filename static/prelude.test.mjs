import * as prelude from './prelude.mjs';
import * as test from './test.mjs';

/**
 * @typedef {import('./prelude.mjs').HasTag} HasTag
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

const matchShouldCorrectlyApplyPatternsBasedOnTheTagProperty = test.makeTest(
  'match() should correctly apply patterns based on the tag property',
  () => {
    test.assert(area(shapes[0]) === (Math.PI * 5) ** 2);
    test.assert(area(shapes[1]) === 10 * 20);
    test.assert(area(shapes[2]) === (5 * 10) / 2);
  },
);

const matchShouldApplyTheDefaultPatternWhenNoMatchingTagIsFound = test.makeTest(
  'match() should apply the default pattern when no matching tag is found',
  () => {
    test.assert(area({ tag: 'unknown' }) === 0);
  },
);

const matchShouldThrowAnErrorIfNoMatchingPatternAndNoDefaultPatternAreProvided =
  test.makeTest(
    'match() should throw an error if no matching pattern and no default pattern are provided',
    () => {
      const shapes = [
        { tag: 'circle', radius: 5 },
        { tag: 'unknown', width: 10, height: 20 },
      ];

      const area = prelude.match({
        circle: ({ radius }) => 2 * Math.PI * radius,
      });

      test.assertThrows(
        () => area(shapes[1]),
        Error,
        'No matching pattern for value: {"tag":"unknown","width":10,"height":20}',
      );
    },
  );

export const tests = [
  matchShouldCorrectlyApplyPatternsBasedOnTheTagProperty,
  matchShouldApplyTheDefaultPatternWhenNoMatchingTagIsFound,
  matchShouldThrowAnErrorIfNoMatchingPatternAndNoDefaultPatternAreProvided,
];
