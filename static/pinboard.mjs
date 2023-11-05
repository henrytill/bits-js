// @ts-check

/**
 * @typedef {Object} Post
 * @property {URL} href
 * @property {Date} time
 * @property {string?} description
 * @property {string?} extended
 * @property {string[]} tag
 * @property {string} hash
 * @property {boolean} shared
 * @property {boolean} toread
 */

/**
 * @param {DOMParser} parser
 * @param {string} xml
 * @returns {Post[]}
 */
export const parsePosts = (parser, xml) => {
  const document = parser.parseFromString(xml, 'application/xml');
  let ret = [];
  for (let post of document.querySelectorAll('post')) {
    const hrefstr = post.getAttribute('href');
    if (hrefstr === null) {
      console.log('Attempted to parse post without href');
      continue;
    }
    const href = new URL(hrefstr);
    const timestr = post.getAttribute('time');
    if (timestr === null) {
      console.log('Attempted to parse post without time');
      continue;
    }
    const time = new Date(timestr);
    const description = post.getAttribute('description');
    const extended = post.getAttribute('extended');
    const tag = post.getAttribute('tag')?.split(' ') ?? [];
    const hash = post.getAttribute('hash');
    if (hash === null) {
      console.log('Attempted to parse post without hash');
      continue;
    }
    const shared = (post.getAttribute('shared') ?? 'no') === 'yes';
    const toread = (post.getAttribute('toread') ?? 'no') === 'yes';
    ret.push({
      href,
      time,
      description,
      extended,
      tag,
      hash,
      shared,
      toread,
    });
  }
  return ret;
};
