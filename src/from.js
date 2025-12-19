// @ts-check

import { DIR, FILE, LINK, INT_SIZE, DATE_SIZE, USE_MTIME, type, fromNumber } from './shared.js';

const { fromCharCode } = String;
const decoder = new TextDecoder;

/**
 * @param {Uint8Array<ArrayBuffer>} value
 * @param {number} i
 * @returns {Date}
 */
const fromDate = (value, i) => new Date(
  fromCharCode.apply(null, value.subarray(i, i + DATE_SIZE))
);

/**
 * @param {Uint8Array<ArrayBuffer>} value
 * @param {number} i
 * @param {number} [length]
 * @returns {string}
 */
const fromString = (value, i, length = fromNumber(value, i)) =>
  decoder.decode(value.subarray(i + INT_SIZE, i + INT_SIZE + length));

/**
 * @param {Uint8Array<ArrayBuffer>} value
 * @param {number} i
 * @returns {[number, string]}
 */
const lengthAndName = (value, i) => {
  const length = fromNumber(value, i);
  return [length, fromString(value, i, length)];
};

/**
 * @param {import('./shared.js').EmscriptenFS} FS
 * @param {string} path
 * @param {Uint8Array<ArrayBuffer>} ui8a
 * @param {number} i
 * @returns {number}
 */
const resolve = (FS, path, ui8a, i) => {
  const mode = fromNumber(ui8a, i);
  i += INT_SIZE;

  // TODO: do we actually need this?
  const mtime = USE_MTIME ? fromDate(ui8a, i) : null;
  i += DATE_SIZE;

  const [length, name] = lengthAndName(ui8a, i);
  i += INT_SIZE + length;

  const fn = path + '/' + name;

  switch (type(FS, mode)) {
    case DIR: {
      // if the directory already exists, just ignore.
      try { FS.mkdir(fn) } catch {}
  
      let entries = fromNumber(ui8a, i);
      i += INT_SIZE;

      while (entries--) i = resolve(FS, fn, ui8a, i);
      break;
    }
    case FILE: {
      const size = fromNumber(ui8a, i);
      i += INT_SIZE;

      const data = ui8a.subarray(i, i + size);
      i += size;

      FS.writeFile(fn, data);
      FS.chmod(fn, mode);
      break;
    }
    case LINK: {
      const [length, name] = lengthAndName(ui8a, i);
      i += INT_SIZE + length;

      FS.symlink(name, fn);
      break;
    }
  }

  return i;
};

/**
 * @param {import('./shared.js').EmscriptenFS} FS
 * @param {string} path
 * @param {Blob} blob
 * @returns {Promise<void>}
 */
export default async (FS, path, blob) => {
  const ui8a = new Uint8Array(await blob.arrayBuffer());
  const length = ui8a.length;
  path = path.replace(/\/$/, '');

  let i = 0;
  while (i < length) i = resolve(FS, path, ui8a, i);
};
