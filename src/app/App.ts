import { IController, IHTML5CanvasElement } from '@plasmastrapi/html5-canvas';
import { Index } from '@plasmastrapi/base';
import { Engine, Stor } from '@plasmastrapi/ecs';
import HTML5CanvasViewport from './HTML5CanvasViewport';

export default class App<TControllers extends Index<IController>> extends Engine {
  public readonly root: IHTML5CanvasElement;
  public readonly controllers: TControllers;

  public constructor({
    canvas,
    controllers,
    systems,
  }: {
    canvas: HTMLCanvasElement;
    controllers: TControllers;
    systems: Stor[];
  }) {
    super({
      viewport: new HTML5CanvasViewport({ canvas }),
      systems,
    });
    this.controllers = controllers;
  }

  public get myViewport(): HTML5CanvasViewport {
    return this.viewport as HTML5CanvasViewport;
  }

  public init(): void {
    for (const name in this.controllers) {
      this.controllers[name].init();
    }
  }

  public load(src: string): void {
    this.viewport.load(src);
  }
}
