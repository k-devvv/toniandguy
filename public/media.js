import DIMENSIONS from './image-dimensions.json' with { type: 'json' };
export function imageAttributes(src, { priority = false } = {}) {
  const size = DIMENSIONS[src];
  if (!size) throw new Error('Missing intrinsic image size: ' + src);
  return `width="${size.width}" height="${size.height}" loading="${priority ? 'eager' : 'lazy'}" decoding="async"`;
}
