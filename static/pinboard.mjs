/**
 * @typedef {Object} Post
 * @property {URL} href
 * @property {Date} time
 * @property {string} [description]
 * @property {string} [extended]
 * @property {string[]} tag
 * @property {string} [hash]
 * @property {boolean} shared
 * @property {boolean} toread
 */

/**
 * @param {DOMParser} parser
 * @param {string} xml
 * @returns {Post[]}
 */
export const parseXml = (parser, xml) => {
  const ret = [];

  const document = parser.parseFromString(xml, 'application/xml');

  for (const post of document.querySelectorAll('post')) {
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
    const description = post.getAttribute('description')?.trim() || undefined;
    const extended = post.getAttribute('extended')?.trim() || undefined;
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
      tag,
      hash,
      shared,
      toread,
      ...(description !== undefined && { description }),
      ...(extended !== undefined && { extended }),
    });
  }

  return ret;
};

/**
 * @param {DOMParser} parser
 * @param {string} html
 * @returns {Post[]}
 */
export const parseHtml = (parser, html) => {
  const ret = [];

  /** @type {string | undefined} */
  let extended = undefined;

  const document = parser.parseFromString(html, 'text/html');

  for (const dt_selector of document.querySelectorAll('dt')) {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const anchor_selector = dt_selector.querySelectorAll('a');
    if (anchor_selector.length !== 1) {
      console.error(`anchor_selector.length = ${anchor_selector.length}`);
      continue;
    }
    const [anchor_element] = anchor_selector;
    const hrefstr = anchor_element.getAttribute('href');
    if (hrefstr === null) {
      console.error('Attempted to parse post without href');
      continue;
    }
    const href = new URL(hrefstr);
    const timestr = anchor_element.getAttribute('add_date');
    if (timestr === null) {
      console.error('Attempted to parse post without time');
      continue;
    }
    const time = new Date(parseInt(timestr) * 1000);
    const tag = anchor_element.getAttribute('tags')?.split(',') ?? [];
    const shared = (anchor_element.getAttribute('private') ?? '1') === '0';
    const toread = (anchor_element.getAttribute('toread') ?? '0') === '1';
    const description = anchor_element.textContent?.trim() || undefined;
    const dd_element = dt_selector.nextElementSibling;
    if (dd_element && dd_element.tagName.toLowerCase() === 'dd') {
      extended = dd_element.textContent?.trim() || undefined;
    }
    ret.push({
      href,
      time,
      tag,
      shared,
      toread,
      ...(description !== undefined && { description }),
      ...(extended !== undefined && { extended }),
    });
  }

  return ret;
};
