import { InputHandler, MOUSE_EVENT } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class AtomInputHandler extends InputHandler {
  public init(): void {}

  public dispose(): void {}

  [MOUSE_EVENT.CLICK](event: MouseEvent): void {
    app.controllers.atom.click(event);
  }

  [MOUSE_EVENT.MOUSE_MOVE](event: MouseEvent): void {
    app.controllers.atom.mousemove(event);
  }
}
