import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import { VelocityComponent } from '@plasmastrapi/physics';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export default class WormController implements IController {
  private __worm: HTML5CanvasElement;
  private __storedState?: [WORM_FACING, WORM_ACTION];

  public init(): void {
    this.__worm = new Worm({ x: 100, y: 100 });
  }

  @OveriddenByAction(WORM_ACTION.JUMP)
  @SaveStoredState
  public startWalkingLeft(): void {
    this.__worm.$patch(WormStateComponent, { facing: WORM_FACING.LEFT, action: WORM_ACTION.WALK });
  }

  @OveriddenByAction(WORM_ACTION.JUMP)
  @SaveStoredState
  public startWalkingRight(): void {
    this.__worm.$patch(WormStateComponent, { facing: WORM_FACING.RIGHT, action: WORM_ACTION.WALK });
  }

  @ClearStoredState
  @OveriddenByAction(WORM_ACTION.JUMP)
  @OveriddenByState([WORM_FACING.RIGHT, WORM_ACTION.WALK])
  public stopWalkingLeft(): void {
    this.__worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE });
    this.__worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
  }

  @ClearStoredState
  @OveriddenByAction(WORM_ACTION.JUMP)
  @OveriddenByState([WORM_FACING.LEFT, WORM_ACTION.WALK])
  public stopWalkingRight(): void {
    this.__worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE });
    this.__worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
  }

  @OveriddenByAction(WORM_ACTION.JUMP)
  public jumpForward(): void {
    this.__worm.$patch(WormStateComponent, { action: WORM_ACTION.JUMP });
    const facing = this.__worm.$copy(WormStateComponent)!.facing === WORM_FACING.RIGHT ? 1 : -1;
    this.__worm.$patch(VelocityComponent, { x: facing * 300, y: -200, w: 0 });
  }

  public once(): void {
    const { facing, action } = this.__worm.$copy(WormStateComponent)!;
    const f = facing === WORM_FACING.RIGHT ? 1 : -1;
    if (action === WORM_ACTION.WALK) {
      this.__worm.$patch(VelocityComponent, { x: f * 60, y: -10, w: 0 });
      return;
    }
    if (action === WORM_ACTION.IDLE && this.__storedState) {
      this.__worm.$patch(WormStateComponent, { facing: this.__storedState[0], action: this.__storedState[1] });
      return;
    }
    const velocity = this.__worm.$copy(VelocityComponent)!;
    if (velocity.x === 0 && velocity.y === 0 && velocity.w === 0) {
      this.__worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE });
      return;
    }
    if (action === WORM_ACTION.JUMP) {
      return;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OveriddenByAction(action: WORM_ACTION) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      const { action: currentAction, facing: currentFacing } = this.__worm.$copy(WormStateComponent);
      if (action === currentAction) {
        return;
      }
      fn.apply(this, arguments);
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OveriddenByState(state: [facing: WORM_FACING, action: WORM_ACTION]) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      const { facing, action } = this.__worm.$copy(WormStateComponent)!;
      if (state[0] === facing && state[1] === action) {
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
    this.__storedState = undefined;
    fn.apply(this, arguments);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SaveStoredState({}, {}, descriptor: PropertyDescriptor): void {
  const fn = descriptor.value;
  descriptor.value = function (): void {
    fn.apply(this, arguments);
    const state = this.__worm.$copy(WormStateComponent);
    this.__storedState = [state.facing, state.action];
  };
}
