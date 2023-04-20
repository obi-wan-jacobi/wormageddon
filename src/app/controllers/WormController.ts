import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import ReticleComponent from 'app/components/ReticleComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export default class WormController implements IController {
  private __worm: HTML5CanvasElement;

  public init(): void {
    this.__worm = new Worm({ x: 100, y: 100 });
  }

  @SaveStoredState([WORM_FACING.LEFT, WORM_ACTION.WALK])
  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.WALK, WORM_ACTION.AIM])
  @UpdateWormState([WORM_FACING.LEFT, WORM_ACTION.WALK])
  public startWalkingLeft(): void {}

  @SaveStoredState([WORM_FACING.RIGHT, WORM_ACTION.WALK])
  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.WALK, WORM_ACTION.AIM])
  @UpdateWormState([WORM_FACING.RIGHT, WORM_ACTION.WALK])
  public startWalkingRight(): void {}

  @OveriddenByState([WORM_FACING.RIGHT, WORM_ACTION.WALK])
  @ClearStoredState
  @AllowedDuring([WORM_ACTION.WALK])
  @UpdateWormAction(WORM_ACTION.IDLE)
  public stopWalkingLeft(): void {}

  @OveriddenByState([WORM_FACING.LEFT, WORM_ACTION.WALK])
  @ClearStoredState
  @AllowedDuring([WORM_ACTION.WALK])
  @UpdateWormAction(WORM_ACTION.IDLE)
  public stopWalkingRight(): void {}

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.WALK, WORM_ACTION.AIM])
  @UpdateWormAction(WORM_ACTION.JUMP)
  public jumpForward(): void {}

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.AIM])
  @UpdateWormAction(WORM_ACTION.AIM)
  public startAimingUp(): void {
    const { angle } = this.__worm.$copy(ReticleComponent);
    let a = radToDeg(angle);
    if (a > -90) {
      a -= 6;
      this.__worm.$patch(ReticleComponent, { angle: degToRad(a) });
    }
  }

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.AIM])
  @UpdateWormAction(WORM_ACTION.AIM)
  public startAimingDown(): void {
    const { angle } = this.__worm.$copy(ReticleComponent);
    let a = radToDeg(angle);
    if (a < 90) {
      a += 6;
      this.__worm.$patch(ReticleComponent, { angle: degToRad(a) });
    }
  }

  @AllowedDuring([WORM_ACTION.AIM])
  @UpdateWormAction(WORM_ACTION.AIM)
  public stopAimingUp(): void {}

  @AllowedDuring([WORM_ACTION.AIM])
  @UpdateWormAction(WORM_ACTION.AIM)
  public stopAimingDown(): void {}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function UpdateWormState(state: [facing: WORM_FACING, action: WORM_ACTION]) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      const [facing, action] = state;
      this.__worm.$patch(WormStateComponent, { facing, action });
      fn.apply(this, arguments);
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function UpdateWormAction(action: WORM_ACTION) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      this.__worm.$patch(WormStateComponent, { action });
      fn.apply(this, arguments);
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OveriddenByState(state: [facing: WORM_FACING, action: WORM_ACTION]) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      const { facing, action } = this.__worm.$copy(WormStateComponent);
      if (state[0] === facing && state[1] === action) {
        return;
      }
      fn.apply(this, arguments);
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OveriddenByAction(action: WORM_ACTION) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      if (action === this.__worm.$copy(WormStateComponent).action) {
        return;
      }
      fn.apply(this, arguments);
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AllowedDuring(actions: WORM_ACTION[]) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      if (!actions.includes(this.__worm.$copy(WormStateComponent).action)) {
        return;
      }
      fn.apply(this, arguments);
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ClearStoredState({}, {}, descriptor: PropertyDescriptor): void {
  const fn = descriptor.value;
  descriptor.value = function (): void {
    if (!this.__isLeftDown && !this.__isRightDown) {
      this.__worm.$patch(WormStateComponent, { stored: undefined });
    }
    fn.apply(this, arguments);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SaveStoredState(state: [facing: WORM_FACING, action: WORM_ACTION]) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      const [facing, action] = state;
      this.__worm.$patch(WormStateComponent, { stored: { facing, action } });
      fn.apply(this, arguments);
    };
  };
}

function radToDeg(rads: number): number {
  return Math.round((rads * 180) / Math.PI);
}

function degToRad(degs: number): number {
  return (Math.round(degs) * Math.PI) / 180;
}
