import { Index } from '@plasmastrapi/base';
import { IKeyboardEvent, InputHandler, KEYBOARD_EVENT } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class ViewportInputHandler extends InputHandler {
  private __keyDownMap: Index<Function> = {
    ArrowUp: () => app.controllers.viewport.startPanningUp(),
    ArrowDown: () => app.controllers.viewport.startPanningDown(),
    ArrowLeft: () => app.controllers.viewport.startPanningLeft(),
    ArrowRight: () => app.controllers.viewport.startPanningRight(),
  };

  private __keyUpMap: Index<Function> = {
    ArrowUp: () => app.controllers.viewport.stopPanningUp(),
    ArrowDown: () => app.controllers.viewport.stopPanningDown(),
    ArrowLeft: () => app.controllers.viewport.stopPanningLeft(),
    ArrowRight: () => app.controllers.viewport.stopPanningRight(),
  };

  public init(): void {}

  public dispose(): void {}

  [KEYBOARD_EVENT.KEY_DOWN](event: IKeyboardEvent): void {
    if (this.__keyDownMap[event.key]) {
      this.__keyDownMap[event.key]();
    }
  }

  [KEYBOARD_EVENT.KEY_UP](event: IKeyboardEvent): void {
    if (this.__keyUpMap[event.key]) {
      this.__keyUpMap[event.key]();
    }
  }
}
