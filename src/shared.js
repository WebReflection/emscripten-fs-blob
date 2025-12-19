// @ts-check

export const NUL = 0;
export const DIR = 1;
export const FILE = 2;
export const LINK = 3;

export const INT_SIZE = 4;
export const DATE_SIZE = 24; // (new Date()).toISOString().length;

export const USE_MTIME = false;

const ui8a = new Uint8Array(INT_SIZE);
const dv = new DataView(ui8a.buffer);

/**
 * @param {number} value
 * @returns {Uint8Array<ArrayBuffer>}
 */
export const toNumber = value => {
  dv.setUint32(0, value, true);
  return ui8a.slice(0, INT_SIZE);
};

/**
 * @param {Uint8Array<ArrayBuffer>} value
 * @param {number} i
 * @returns {number}
 */
export const fromNumber = (value, i) => {
  for (let j = 0; j < INT_SIZE; j++) ui8a[j] = value[i + j];
  return dv.getUint32(0, true);
};

/** @typedef {{isDir: (mode: number) => boolean, isFile: (mode: number) => boolean, isLink: (mode: number) => boolean, mkdir: (path: string) => void, readdir: (path: string) => string[], readlink: (path: string) => string, stat: (path: string) => { mode: number, mtime: Date }, readFile: (path: string, options: { encoding: 'binary' }) => Uint8Array<ArrayBuffer>, symlink: (oldpath: string, newpath: string) => void, writeFile: (path: string, data: Uint8Array) => void, chmod: (path: string, mode: number) => void}} EmscriptenFS */

/**
 * @param {EmscriptenFS} FS
 * @param {number} mode
 * @returns {typeof DIR | typeof FILE | typeof LINK | typeof NUL}
 */
export const type = (FS, mode) => {
  if (FS.isDir(mode)) return DIR;
  if (FS.isFile(mode)) return FILE;
  if (FS.isLink(mode)) return LINK;
  return NUL;
};
