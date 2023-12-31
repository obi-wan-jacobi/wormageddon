/* eslint-disable @typescript-eslint/naming-convention */
import { Index } from '@plasmastrapi/base';
import { IKeyboardEvent, InputHandler, KEYBOARD_EVENT } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class WormInputHandler extends InputHandler {
  private __keyDownMap: Index<Function> = {
    // movement
    w: () => app.controllers.worm.startAimingUp(),
    s: () => app.controllers.worm.startAimingDown(),
    a: () => app.controllers.worm.startWalkingLeft(),
    d: () => app.controllers.worm.startWalkingRight(),
    // jumping
    ' ': () => app.controllers.worm.jumpForward(),
    // firing
    f: () => app.controllers.worm.startFiring(),
  };

  private __keyUpMap: Index<Function> = {
    // movement
    w: () => app.controllers.worm.stopAimingUp(),
    s: () => app.controllers.worm.stopAimingDown(),
    a: () => app.controllers.worm.stopWalkingLeft(),
    d: () => app.controllers.worm.stopWalkingRight(),
    // equip
    e: () => app.controllers.worm.equip(),
    // unequip
    q: () => app.controllers.worm.unequip(),
    // firing
    f: () => app.controllers.worm.stopFiring(),
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
