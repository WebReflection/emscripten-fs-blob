# emscripten-fs-blob

Emscripten FS as sharable and recoverable Blob.

```js
import { fromBlob, toBlob } from 'https://esm.run/emscripten-fs-blob';

// toBlob(FS, path)
const blob = toBlob(emscripten.FS, '/');

// restore via ...
// fromBlob(FS, path, blob)
await fromBlob(emscripten.FS, '/', blob);
```

A *Blob* can travel via `postMessage` and other structured-clone compatible mechanisms + it can be also compressed and decompressed with eaase.

```js
import { fromBlob, toBlob, compress, decompress } from 'https://esm.run/emscripten-fs-blob';

// compress(blob, type = 'gzip')
const blob = await compress(toBlob(emscripten.FS, '/'));

// decompress(blob_response_value, type = 'gzip')
await fromBlob(emscripten.FS, '/', await decompress(blob));
```

And that's all folks 🥕


## Technical details

This is a quick walk through the way the FS is stored as binary.

#### FS to Blob

  * given a `path`, `FS.readdir(path)` is used to filter what matteers:
    * *directories*
    * *files*
    * *symlink*
  * all kinds are stored with the following common details:
    * *mode*, as unsigned integer, out of stats
    * *mtime*, a fixed `24` codes length ISO string converted into ASCII uint8 numbers, as modification *Date*
    * *name*, as utf-8 encoded buffer of the source name
  * each type adds extra details to the buffer:
    * *directories* have an unsigned integer representing the amount of entries present within such directory, where these entries are also either *directory*, *file*, or *symlink*
      * if that amount is `0`, that's it, an *empty folder*
      * if that amount is greater than `0`, we are back to the beginning of this logic except the `path` this time will have the *name* included, so that it's linearly traversed per folder
    * *files* have an unsigned integer that specifies size of the buffer plus the buffers itself as utf-8 byte array
    * *symlinks* add a utf-8 compatible string representation of their value, where a *string* is a buffer that starts with a length of the rest of the buffer, and the rest of the buffer itself

#### Blob to FS

  * given a `path` to restore and a *Blob* representing the *FS*, only these kinds will be restored:
    * *directories*
    * *files*
    * *symlink*
  * all kinds are restored by crawling the buffer to retrieve:
    * *mode*, as unsigned integer
    * *mtime*, as *Date* reference from the *ISO* string
    * *name*, as the current name of the entry (no full path, just the current one)
  * each type crawls extra data from the buffer:
    * *directories* have a size, if this is greater than `0` then the same logic is applied using the `path` plus the current directory entry name
    * *files* have a size about the rest of the buffer, these get injected directly as buffer into the *FS* with the *name*, out of the current *path*, and the *mode* is set too
    * *symlinks* have a string retrieved from the buffer and these are created as these are