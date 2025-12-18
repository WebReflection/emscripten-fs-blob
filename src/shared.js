export const NUL = 0;
export const DIR = 1;
export const FILE = 2;
export const LINK = 3;

export const ui8a = new Uint8Array(4);
export const dv = new DataView(ui8a.buffer);

export const type = (FS, mode) => {
  if (FS.isDir(mode)) return DIR;
  if (FS.isFile(mode)) return FILE;
  if (FS.isLink(mode)) return LINK;
  return NUL;
};
