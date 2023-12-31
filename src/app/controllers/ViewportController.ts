import { IPoint } from '@plasmastrapi/geometry';
import { IController } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

const PANNING_INCREMENT = 10;

export default class ViewportController implements IController {
  private __intervalID?: NodeJS.Timeout;
  private __panningIncrements: { up: number; down: number; left: number; right: number } = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  };

  public init(): void {}

  @StartsTranslationInterval('up', -PANNING_INCREMENT)
  public startPanningUp(): void {}

  @StartsTranslationInterval('down', PANNING_INCREMENT)
  public startPanningDown(): void {}

  @StartsTranslationInterval('left', -PANNING_INCREMENT)
  public startPanningLeft(): void {}

  @StartsTranslationInterval('right', PANNING_INCREMENT)
  public startPanningRight(): void {}

  @StartsTranslationInterval('up', 0)
  public stopPanningUp(): void {}

  @StartsTranslationInterval('down', 0)
  public stopPanningDown(): void {}

  @StartsTranslationInterval('left', 0)
  public stopPanningLeft(): void {}

  @StartsTranslationInterval('right', 0)
  public stopPanningRight(): void {}

  private __startTranslatingOrigin(): void {
    if (this.__intervalID) {
      clearInterval(this.__intervalID);
      this.__intervalID = undefined;
    }
    const transform = {
      x: this.__panningIncrements.left + this.__panningIncrements.right,
      y: this.__panningIncrements.up + this.__panningIncrements.down,
    };
    if (transform.x === 0 && transform.y === 0) {
      return;
    }
    this.__translateOrigin(transform);
    this.__intervalID = setInterval(() => this.__translateOrigin(transform), 10);
  }

  private __translateOrigin(transform: IPoint): void {
    app.myViewport.origin = {
      x: app.myViewport.origin.x + transform.x,
      y: app.myViewport.origin.y + transform.y,
    };
  }
}

function StartsTranslationInterval(direction: 'up' | 'down' | 'left' | 'right', panningIncrement: number) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      fn.apply(this, arguments);
      this.__panningIncrements[direction] = panningIncrement;
      this.__startTranslatingOrigin();
    };
  };
}
