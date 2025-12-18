import { DIR, FILE, LINK, NUL, dv, type, ui8a } from './shared.js';

const encoder = new TextEncoder;

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

const toDate = value => {
  const iso = value.toISOString();
  return Uint8Array.from(iso, c => c.charCodeAt(0));
};

const toNumber = value => {
  dv.setUint32(0, value, true);
  return ui8a.slice(0, 4);
};

const toString = value => {
  const encoded = encoder.encode(value);
  const l = encoded.length;
  const view = new Uint8Array(l + 4);
  view.set(toNumber(l), 0);
  view.set(encoded, 4);
  return view;
};

const toBlob = (FS, path, entries = getEntries(FS, path)) => {
  const result = [];
  for (const entry of entries) {
    const fullPath = path === '/' ? '/' + entry : path + '/' + entry;
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
            result.push(toBlob(FS, fullPath, subEntries));
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
