// @ts-check

import fromBlob from './from.js';
import toBlob from './to.js';

export { fromBlob, toBlob };

/** @typedef {Blob|Response|BlobPart} Streamable */

/**
 * @param {Streamable} value
 * @returns {ReadableStream<Uint8Array<ArrayBuffer>>}
 */
const stream = value => {
  if (value instanceof Blob)
    return value.stream();

  if (value instanceof Response)
    return /** @type {ReadableStream<Uint8Array<ArrayBuffer>>} */ (value.body);

  return new Blob([value]).stream();
};

/**
 * @param {Streamable} value
 * @param {CompressionFormat} type
 * @returns {Promise<Blob>}
 */
export const compress = (value, type = 'gzip') => new Response(stream(value).pipeThrough(new CompressionStream(type))).blob();

/**
 * @param {Streamable} value
 * @param {CompressionFormat} type
 * @returns {Promise<Blob>}
 */
export const decompress = (value, type = 'gzip') => new Response(stream(value).pipeThrough(new DecompressionStream(type))).blob();
