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
