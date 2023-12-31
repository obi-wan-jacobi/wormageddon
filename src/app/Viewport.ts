/* eslint-disable @typescript-eslint/no-unused-vars */
import { Void, clone } from '@plasmastrapi/base';
import {
  Atomic,
  ICache,
  IImage,
  ILabel,
  IRenderingContext,
  IRenderingPoint,
  IRenderingPose,
  IStyle,
  IViewport,
} from '@plasmastrapi/viewport';

interface IPayload {
  pose?: IRenderingPose;
  path?: IRenderingPoint[];
  position?: IRenderingPoint;
  style: IStyle;
}

export default abstract class Viewport<
  TImage extends {},
  TImageSource extends { width: number; height: number },
  TImageData extends { data: any },
> implements IViewport
{
  public readonly width: number;
  public readonly height: number;

  protected _origin: IRenderingPoint = { x: 0, y: 0 };
  protected _ctx: IRenderingContext<TImageSource, TImageData>;
  protected _imageCache: ICache<TImage, TImageSource>;
  protected _pixelCache: ICache<TImageData, TImageData>;
  protected _zBuffer: Array<{ method: Void<any>; payload: IPayload }> = [];

  public constructor({
    ctx,
    imageCache,
    pixelCache,
    width,
    height,
  }: {
    ctx: IRenderingContext<TImageSource, TImageData>;
    imageCache: ICache<TImage, TImageSource>;
    pixelCache: ICache<TImageData, TImageData>;
    width: number;
    height: number;
  }) {
    this._ctx = ctx;
    this._imageCache = imageCache;
    this._pixelCache = pixelCache;
    this.width = width;
    this.height = height;
  }

  public get origin(): IRenderingPoint {
    return clone(this._origin);
  }

  public set origin(origin: IRenderingPoint) {
    this._origin = origin;
  }

  public load<T, TSource>(key: string, image?: T & TImage): TSource & TImageSource {
    return this._imageCache.load(key, image) as any;
  }

  public render(): void {
    this._ctx.clearRect(0, 0, this.width, this.height);
    const artifactsWithinFrame = this._zBuffer.filter((target) => {
      const { pose, path, position } = target.payload;
      return [
        pose !== undefined && isPointWithinFrame(pose, this._origin, this.width, this.height),
        path !== undefined && path.some((p) => isPointWithinFrame(p, this._origin, this.width, this.height)),
        position !== undefined && isPointWithinFrame(position, this._origin, this.width, this.height),
      ].some((c) => c);
    });
    const artifactTransformationsRelativeToViewportOrigin = artifactsWithinFrame.map((target) => {
      const transformation = {
        method: target.method,
        payload: clone(target.payload),
      };
      const { pose, path, position } = transformation.payload;
      if (pose !== undefined) {
        transformation.payload.pose = {
          x: pose.x - this._origin.x,
          y: pose.y - this._origin.y,
          a: pose.a,
        };
      }
      if (path !== undefined) {
        transformation.payload.path = path.map((p) => ({
          x: p.x - this._origin.x,
          y: p.y - this._origin.y,
        }));
      }
      if (position !== undefined) {
        transformation.payload.position = {
          x: position.x - this._origin.x,
          y: position.y - this._origin.y,
        };
      }
      return transformation;
    });
    const zOrdered = artifactTransformationsRelativeToViewportOrigin.sort(
      (a, b) => a.payload.style.zIndex - b.payload.style.zIndex,
    );
    zOrdered.forEach((target) => target.method.apply(this, [target.payload]));
    this._zBuffer = [];
  }

  @ZBuffered
  public drawImage(payload: { pose: IRenderingPose; image: IImage; style: IStyle }): void {}

  @ZBuffered
  public drawShape(payload: { path: IRenderingPoint[]; style: IStyle }): void {}

  @ZBuffered
  public drawLine(payload: { path: IRenderingPoint[]; style: IStyle }): void {}

  @ZBuffered
  public drawLabel(payload: { pose: IRenderingPose; label: ILabel; style: IStyle }): void {}

  @ZBuffered
  public drawCircle(payload: { position: IRenderingPoint; radius: number; style: IStyle }): void {}

  @ZBuffered
  public drawPixel(payload: { position: IRenderingPoint; style: IStyle }): void {}

  public drawPixelMap(payload: {
    cacheKey: string;
    position: IRenderingPoint;
    pixels: string[];
    scalingFactor: number;
    isDirty: boolean;
  }): void {
    const style = {
      colour: 'rgba(0,0,0,0)',
      fill: 'rgba(0,0,0,0)',
      opacity: 1,
      zIndex: 9999,
    };
    this._zBuffer.push({
      method: this.__drawPixelMap,
      payload: Object.assign({}, payload, { style }),
    });
  }

  @Atomic
  private __drawImage({ pose, image }: { pose: IRenderingPose; image: IImage }): void {
    const asset = this.load(image.src);
    const x = pose.x + (image.offset?.x || 0);
    const y = pose.y + (image.offset?.y || 0);
    this._ctx.translate(x, y);
    this._ctx.rotate(image.rotate || 0);
    this._ctx.drawImage(
      /* image: */ asset,
      /* sx:    */ image.crop?.sourceX || 0,
      /* sy:    */ image.crop?.sourceY || 0,
      /* sw:    */ image.crop?.sourceWidth || image.width || (asset.width as number),
      /* sh:    */ image.crop?.sourceHeight || image.height || (asset.height as number),
      /* dx:    */ 0,
      /* dy:    */ 0,
      /* dw:    */ image.width || (asset.width as number),
      /* dh:    */ image.height || (asset.height as number),
    );
  }

  @Atomic
  private __drawShape({ path, style }: { path: IRenderingPoint[]; style: IStyle }): void {
    this._ctx.globalAlpha = style.opacity;
    this._ctx.strokeStyle = style.colour;
    this._ctx.beginPath();
    path.forEach((p: IRenderingPoint) => {
      this._ctx.lineTo(p.x, p.y);
    });
    this._ctx.fillStyle = style.fill;
    this._ctx.fill();
    this._ctx.closePath();
    this._ctx.stroke();
  }

  @Atomic
  private __drawLine({ path, style }: { path: IRenderingPoint[]; style: IStyle }): void {
    this._ctx.strokeStyle = style.colour;
    this._ctx.beginPath();
    path.forEach((p: IRenderingPoint) => {
      this._ctx.lineTo(p.x, p.y);
    });
    this._ctx.stroke();
  }

  @Atomic
  private __drawLabel({ pose, label, style }: { pose: IRenderingPose; style: IStyle; label: ILabel }): void {
    this._ctx.fillStyle = style.colour;
    this._ctx.font = `${label.fontSize}px Arial`;
    this._ctx.fillText(label.text, pose.x + label.offset.x, pose.y + label.offset.y);
  }

  @Atomic
  private __drawCircle({ position, radius, style }: { position: IRenderingPoint; radius: number; style: IStyle }): void {
    this._ctx.globalAlpha = style.opacity;
    this._ctx.strokeStyle = style.colour;
    this._ctx.fillStyle = style.fill;
    this._ctx.beginPath();
    this._ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    this._ctx.fill();
    this._ctx.closePath();
    this._ctx.stroke();
  }

  @Atomic
  private __drawPixel({ position, style }: { position: IRenderingPoint; style: IStyle }): void {
    const imageData = this._ctx.createImageData(1, 1);
    const data = imageData.data;
    let r = 255;
    let g = 255;
    let b = 255;
    let a = 255;
    const colours = style.colour.split(',');
    if (colours.length === 4) {
      [r, g, b, a] = colours.map((c: string) => Number.parseInt(c));
    }
    [data[0], data[1], data[2], data[3]] = [r, g, b, a];
    this._ctx.putImageData(imageData, position.x, position.y);
  }

  @Atomic
  private __drawPixelMap({
    cacheKey,
    position,
    pixels,
    scalingFactor,
    isDirty,
  }: {
    cacheKey: string;
    position: IRenderingPoint;
    pixels: string[];
    scalingFactor: number;
    isDirty: boolean;
  }): void {
    let imageData = this._pixelCache.load(cacheKey);
    const dimension = Math.sqrt(pixels.length);
    if (!imageData || isDirty) {
      imageData = this._ctx.getImageData(position.x, position.y, dimension, dimension);
      const data = imageData.data;
      for (let i = 0; i < pixels.length; ++i) {
        const [r, g, b, a] = pixels[i].split(',').map((c) => Number.parseInt(c));
        const x = i % dimension;
        const y = Math.floor(i / dimension) * dimension;
        const off = (y + x) * 4;
        data[off] = r;
        data[off + 1] = g;
        data[off + 2] = b;
        data[off + 3] = a;
      }
      this._pixelCache.load(cacheKey, imageData);
    }
    this._ctx.putImageData(imageData, position.x, position.y);
    if (scalingFactor === 1) {
      return;
    }
    this._ctx.scale(scalingFactor, scalingFactor);
    this._ctx.drawImage(
      /* image: */ this._ctx.canvas,
      /* sx:    */ position.x,
      /* sy:    */ position.y,
      /* sw:    */ dimension,
      /* sh:    */ dimension,
      /* dx:    */ position.x / scalingFactor,
      /* dy:    */ position.y / scalingFactor,
      /* dw:    */ dimension,
      /* dh:    */ dimension,
    );
  }
}

function ZBuffered({}, {}, descriptor: PropertyDescriptor): void {
  const fnName = descriptor.value.name;
  descriptor.value = function (): void {
    const payload = arguments[0];
    this._zBuffer.push({
      method: this[`__${fnName}`],
      payload,
    });
  };
}

function isPointWithinFrame(point: IRenderingPoint, origin: IRenderingPoint, width: number, height: number): boolean {
  return point.x >= origin.x && point.x <= origin.x + width && point.y >= origin.y && point.y <= origin.y + height;
}
