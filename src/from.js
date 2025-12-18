import { DIR, FILE, LINK, dv, type, ui8a } from './shared.js';

const { fromCharCode } = String;
const decoder = new TextDecoder;

const fromDate = value => {
  return new Date(fromCharCode(...value));
};

const fromNumber = value => {
  ui8a[0] = value[0];
  ui8a[1] = value[1];
  ui8a[2] = value[2];
  ui8a[3] = value[3];
  return dv.getUint32(0, true);
};

const fromString = value => {
  const length = fromNumber(value);
  return decoder.decode(value.subarray(4, 4 + length));
};

const lengthAndName = value => {
  const length = fromNumber(value);
  const name = fromString(value, length);
  return [length, name];
};

const resolve = (FS, path, ui8a, i) => {
  const mode = fromNumber(ui8a.subarray(i, i + 4));
  i += 4;

  // TODO: do we actually need this?
  const mtime = fromDate(ui8a.subarray(i, i + 24));
  i += 24;

  const [length, name] = lengthAndName(ui8a.subarray(i));
  i += 4 + length;

  const fn = path + '/' + name;

  switch (type(FS, mode)) {
    case DIR: {
      // if the directory already exists, just ignore.
      try { FS.mkdir(fn) } catch {}
  
      let entries = fromNumber(ui8a.subarray(i, i + 4));
      i += 4;

      while (entries--) i = resolve(FS, fn, ui8a, i);
      break;
    }
    case FILE: {
      const size = fromNumber(ui8a.subarray(i, i + 4));
      i += 4;

      const data = ui8a.subarray(i, i + size);
      i += size;

      FS.writeFile(fn, data);
      FS.chmod(fn, mode);
      break;
    }
    case LINK: {
      const [length, name] = lengthAndName(ui8a.subarray(i));
      console.log('LNK', name, path);
      i += 4 + length;

      FS.symlink(name, fn);
      break;
    }
  }

  return i;
};

export default async (FS, path, blob) => {
  const ui8a = new Uint8Array(await blob.arrayBuffer());
  const length = ui8a.length;
  path = path.replace(/\/$/, '');

  let i = 0;
  while (i < length) i = resolve(FS, path, ui8a, i);
};
