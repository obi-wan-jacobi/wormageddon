import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import { VelocityComponent } from '@plasmastrapi/physics';
import AnimationComponent from 'app/components/AnimationComponent';
import FacingComponent from 'app/components/FacingComponent';
import Worm from 'app/entities/Worm';
import { WORM_STATE } from 'app/enums/WORM_STATE';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OveriddenBy(states: WORM_STATE[]) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      if (states.includes(this.__state)) {
        return;
      }
      fn.apply(this, arguments);
    };
  };
}

export default class WormController implements IController {
  private __worm: HTML5CanvasElement;
  private __state: WORM_STATE = WORM_STATE.IDLE;

  public init(): void {
    this.__worm = new Worm({ x: 100, y: 100 });
  }

  @OveriddenBy([WORM_STATE.JUMP])
  public startWalkingLeft(): void {
    this.__state = WORM_STATE.WALK_LEFT;
    this.__worm.$patch(FacingComponent, { direction: 'LEFT' });
    this.__worm.$patch(AnimationComponent, { isPaused: false });
  }

  @OveriddenBy([WORM_STATE.JUMP])
  public startWalkingRight(): void {
    this.__state = WORM_STATE.WALK_RIGHT;
    this.__worm.$patch(FacingComponent, { direction: 'RIGHT' });
    this.__worm.$patch(AnimationComponent, { isPaused: false });
  }

  @OveriddenBy([WORM_STATE.JUMP, WORM_STATE.WALK_RIGHT])
  public stopWalkingLeft(): void {
    this.__state = WORM_STATE.IDLE;
    this.__worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
    this.__worm.$patch(AnimationComponent, { isPaused: true, frame: 0 });
  }

  @OveriddenBy([WORM_STATE.JUMP, WORM_STATE.WALK_LEFT])
  public stopWalkingRight(): void {
    this.__state = WORM_STATE.IDLE;
    this.__worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
    this.__worm.$patch(AnimationComponent, { isPaused: true, frame: 0 });
  }

  @OveriddenBy([WORM_STATE.JUMP])
  public jumpForward(): void {
    this.__state = WORM_STATE.JUMP;
    const facing = this.__worm.$copy(FacingComponent)!.direction === 'RIGHT' ? 1 : -1;
    this.__worm.$patch(VelocityComponent, { x: facing * 300, y: -200, w: 0 });
  }

  public once(): void {
    if (this.__state === WORM_STATE.WALK_RIGHT) {
      this.__worm.$patch(VelocityComponent, { x: 60, y: -10, w: 0 });
      return;
    }
    if (this.__state === WORM_STATE.WALK_LEFT) {
      this.__worm.$patch(VelocityComponent, { x: -60, y: -10, w: 0 });
      return;
    }
    const velocity = this.__worm.$copy(VelocityComponent)!;
    if (velocity.x === 0 && velocity.y === 0 && velocity.w === 0) {
      this.__state = WORM_STATE.IDLE;
    }
  }
}
