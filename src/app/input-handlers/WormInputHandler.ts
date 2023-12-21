import { Index } from '@plasmastrapi/base';
import { IKeyboardEvent, InputHandler, KEYBOARD_EVENT } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class WormInputHandler extends InputHandler {
  private __keyDownMap: Index<Function> = {
    ArrowLeft: () => app.controllers.worm.startWalkingLeft(),
    ArrowRight: () => app.controllers.worm.startWalkingRight(),
    ArrowUp: () => app.controllers.worm.startAimingUp(),
    ArrowDown: () => app.controllers.worm.startAimingDown(),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ' ': () => app.controllers.worm.jumpForward(),
  };

  private __keyUpMap: Index<Function> = {
    ArrowLeft: () => app.controllers.worm.stopWalkingLeft(),
    ArrowRight: () => app.controllers.worm.stopWalkingRight(),
    ArrowUp: () => app.controllers.worm.stopAimingUp(),
    ArrowDown: () => app.controllers.worm.stopAimingDown(),
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
