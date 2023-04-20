import { IImage } from '@plasmastrapi/viewport';

export function buildFrames(
  src: string,
  frameWidth: number,
  frameHeight: number,
  imageHeight: number,
  offset: { x: number; y: number },
  offsetCreep = 0,
): IImage[] {
  const images: IImage[] = [];
  for (let i = 0, L = imageHeight; i < L; i += frameHeight) {
    images.push({
      src,
      crop: { sourceX: 0, sourceY: i, sourceWidth: frameWidth, sourceHeight: frameHeight },
      offset: { x: offset.x - (offsetCreep * i) / frameHeight, y: offset.y },
      width: frameWidth,
      height: frameHeight,
      zIndex: 0,
    });
  }
  return images;
}

export function isPoseEqual(p1: { x: number; y: number }, p2: { x: number; y: number }, epsilon: number): boolean {
  return Math.abs(p1.x - p2.x) <= epsilon && Math.abs(p1.y - p2.y) <= epsilon;
}
