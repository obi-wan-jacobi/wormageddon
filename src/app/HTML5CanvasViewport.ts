import { IViewport } from '@plasmastrapi/viewport';
import Viewport from './Viewport';
import { HTML5ImageCache, HTML5PixelCache } from '@plasmastrapi/html5-canvas';

export default class HTML5CanvasViewport extends Viewport<HTMLImageElement, HTMLCanvasElement, ImageData> implements IViewport {
  public constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({
      ctx: canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D,
      imageCache: new HTML5ImageCache(),
      pixelCache: new HTML5PixelCache(),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  }

  public load<T, TSource>(src: string): TSource & HTMLCanvasElement {
    const image = super.load(src);
    if (image) {
      return image as TSource & HTMLCanvasElement;
    }
    const newImage = new Image();
    newImage.src = src;
    return super.load(src, newImage) as TSource & HTMLCanvasElement;
  }
}
