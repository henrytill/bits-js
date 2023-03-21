// @ts-check

/**
 * Create a greeting
 *
 * @param {string} person - The name of a person to greet
 * @param {Date} today - Today's date
 * @returns {string}
 */
export function greet(person, today = new Date()) {
  return `Hello ${person}, today is ${today.toDateString()}!`;
}
