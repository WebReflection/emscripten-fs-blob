export const NUL = 0;
export const DIR = 1;
export const FILE = 2;
export const LINK = 3;

export const INT_SIZE = 4;

const ui8a = new Uint8Array(INT_SIZE);
const dv = new DataView(ui8a.buffer);

export const toNumber = value => {
  dv.setUint32(0, value, true);
  return ui8a.slice(0, INT_SIZE);
};

export const fromNumber = (value, i) => {
  for (let j = 0; j < INT_SIZE; j++) ui8a[j] = value[i + j];
  return dv.getUint32(0, true);
};

export const type = (FS, mode) => {
  if (FS.isDir(mode)) return DIR;
  if (FS.isFile(mode)) return FILE;
  if (FS.isLink(mode)) return LINK;
  return NUL;
};
