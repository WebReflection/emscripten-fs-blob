import fromBlob from './from.js';
import toBlob from './to.js';

export { fromBlob, toBlob };

const stream = value => {
  if (value instanceof Blob) return value.stream();
  if (value instanceof Response) return value.body;
  return new Blob([value]).stream();
};

export const compress = (value, type = 'gzip') => new Response(stream(value).pipeThrough(new CompressionStream(type))).blob();
export const decompress = (value, type = 'gzip') => new Response(stream(value).pipeThrough(new DecompressionStream(type))).blob();

