// @ts-check

import { DIR, FILE, LINK, NUL, INT_SIZE, DATE_SIZE, USE_MTIME, type, toNumber } from './shared.js';

const encoder = new TextEncoder;

/**
 * @param {import('./shared.js').EmscriptenFS} FS
 * @param {string} path
 * @returns {string[]}
 */
const getEntries = (FS, path) => {
  return FS.readdir(path).filter(entry => {
    if (entry !== '.' && entry !== '..') {
      try {
        return type(FS, FS.stat(path + '/' + entry).mode) !== NUL;
      }
      catch {}
    }
    return false;
  });
};

/**
 * @param {Date} value
 * @returns {Uint8Array<ArrayBuffer>}
 */
const toDate = value => {
  const iso = value.toISOString();
  const view = new Uint8Array(DATE_SIZE);
  if (USE_MTIME) for (let i = 0; i < DATE_SIZE; i++) view[i] = iso.charCodeAt(i);
  return view;
};

/**
 * @param {string} value 
 * @returns {Uint8Array<ArrayBuffer>}
 */
const toString = value => {
  const encoded = encoder.encode(value);
  const l = encoded.length;
  const view = new Uint8Array(l + INT_SIZE);
  view.set(toNumber(l), 0);
  view.set(encoded, INT_SIZE);
  return view;
};

/**
 * @param {string[]} entries
 * @param {string[]} exclude
 * @returns
 */
const options = (entries, exclude) => ({ entries, exclude });

/**
 * @param {import('./shared.js').EmscriptenFS} FS
 * @param {string} path
 * @param {{entries?: string[], exclude?: string[]}} [options]
 * @returns {Blob}
 */
const toBlob = (FS, path, {
  entries = getEntries(FS, path),
  exclude = []
} = options(getEntries(FS, path), [])) => {
  const result = [];
  for (const entry of entries) {
    const fullPath = path === '/' ? '/' + entry : path + '/' + entry;
    if (exclude.some(ignore, fullPath)) continue;
    try {
      const { mode, mtime } = FS.stat(fullPath);
      switch (type(FS, mode)) {
        case DIR: {
          const subEntries = getEntries(FS, fullPath);
          result.push(
            toNumber(mode),
            toDate(mtime),
            toString(entry),
            toNumber(subEntries.length),
          );

          if (subEntries.length > 0)
            result.push(toBlob(FS, fullPath, options(subEntries, exclude)));
          break;
        }
        case FILE: {
          const data = FS.readFile(fullPath, { encoding: 'binary' });
          result.push(
            toNumber(mode),
            toDate(mtime),
            toString(entry),
            toNumber(data.length),
            data,
          );
          break;
        }
        case LINK: {
          const data = toString(FS.readlink(fullPath));
          result.push(
            toNumber(mode),
            toDate(mtime),
            toString(entry),
            data,
          );
          break;
        }
      }
    }
    catch (e) {
      // Log stuff that can't be accessed.
      console.warn(`Skipping ${fullPath}: ${e.message ?? e.name}`);
    }
  }

  return new Blob(result.flat(Infinity));
};

export default toBlob;

/**
 * @param {string|RegExp} exclusion
 * @returns {boolean}
 */
function ignore(exclusion) {
  'use strict';
  return typeof exclusion === 'string' ? (this === exclusion) : exclusion.test(this);
}
