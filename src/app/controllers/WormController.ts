import { Point, Rectangle } from '@plasmastrapi/geometry';
import { AnimationComponent } from '@plasmastrapi/graphics';
import { IController } from '@plasmastrapi/html5-canvas';
import { CONSTANTS } from 'app/CONSTANTS';
import ReticleComponent from 'app/components/ReticleComponent';
import WeaponComponent from 'app/components/WeaponComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import BooleanLevelSubtractor from 'app/entities/BooleanLevelSubtractor';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { getActiveWeaponFramesBasedOnAimingPosition } from 'app/systems/WormStateSystem';
import { degToRad } from 'app/utils';
import blowtorch from 'app/weapons/BlowTorch';

export default class WormController implements IController {
  private __worm: Worm;

  public init(): void {
    this.__worm = new Worm({ x: 50, y: 100 });
  }

  @SaveStoredState([WORM_FACING.LEFT, WORM_ACTION.WALK])
  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.WALK, WORM_ACTION.AIM, WORM_ACTION.EQUIP, WORM_ACTION.UNEQUIP])
  @UpdateWormState([WORM_FACING.LEFT, WORM_ACTION.WALK])
  public startWalkingLeft(): void {}

  @SaveStoredState([WORM_FACING.RIGHT, WORM_ACTION.WALK])
  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.WALK, WORM_ACTION.AIM, WORM_ACTION.EQUIP, WORM_ACTION.UNEQUIP])
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

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.WALK, WORM_ACTION.AIM, WORM_ACTION.EQUIP, WORM_ACTION.UNEQUIP])
  @UpdateWormAction(WORM_ACTION.JUMP)
  public jumpForward(): void {}

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.AIM, WORM_ACTION.EQUIP, WORM_ACTION.UNEQUIP])
  @UpdateWormAction(WORM_ACTION.AIM)
  public startAimingUp(): void {
    startAiming(this.__worm, 'UP');
  }

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.AIM, WORM_ACTION.EQUIP, WORM_ACTION.UNEQUIP])
  @UpdateWormAction(WORM_ACTION.AIM)
  public startAimingDown(): void {
    startAiming(this.__worm, 'DOWN');
  }

  @AllowedDuring([WORM_ACTION.AIM])
  public stopAimingUp(): void {}

  @AllowedDuring([WORM_ACTION.AIM])
  public stopAimingDown(): void {}

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.AIM])
  @UpdateWormAction(WORM_ACTION.EQUIP)
  public equip(): void {
    this.__worm.$add(WeaponComponent, blowtorch);
  }

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.AIM])
  @UpdateWormAction(WORM_ACTION.UNEQUIP)
  public unequip(): void {}

  @AllowedDuring([WORM_ACTION.IDLE, WORM_ACTION.AIM, WORM_ACTION.EQUIP, WORM_ACTION.WALK])
  @UpdateWormAction(WORM_ACTION.FIRE)
  public startFiring(): void {
    if (!this.__worm.$has(WeaponComponent)) {
      restorePreviousAction(this.__worm);
      return;
    }
    const weapon = this.__worm.$copy(WeaponComponent);
    const aimingIndex = weapon.aimingIndex ?? Math.round((weapon.aimingIncrementsInDegrees!.length - 1) / 2);
    const { facing } = this.__worm.$copy(WormStateComponent);
    const f = facing === WORM_FACING.LEFT ? -1 : 1;
    const aimingAngleRadians = degToRad(f * weapon.aimingIncrementsInDegrees![aimingIndex]);
    const position = Point.rotateAboutOrigin({ x: f * 17, y: -1.1 }, aimingAngleRadians);
    this.__worm.$appendChild(
      new BooleanLevelSubtractor({
        pose: { x: position.x, y: position.y, a: aimingAngleRadians },
        shape: Rectangle.create(20, CONSTANTS.WORM.HEIGHT + 2),
      }),
    );
  }

  @AllowedDuring([WORM_ACTION.FIRE])
  @UpdateWormAction(WORM_ACTION.IDLE)
  public stopFiring(): void {
    this.__worm.$children.find((child) => child instanceof BooleanLevelSubtractor)?.$destroy();
  }
}

function startAiming(worm: Worm, aimingDirection: 'UP' | 'DOWN'): void {
  // if no weapon then skip aiming altogether and restore previous action
  if (!worm.$has(WeaponComponent)) {
    restorePreviousAction(worm);
    return;
  }
  const weapon = worm.$copy(WeaponComponent);
  const numberOfAimingIncrements = weapon.aimingIncrementsInDegrees?.length;
  if (numberOfAimingIncrements !== undefined && numberOfAimingIncrements > 0) {
    let aimingIndex = weapon.aimingIndex ?? Math.round((numberOfAimingIncrements - 1) / 2);
    if (aimingIndex === (aimingDirection === 'UP' ? 0 : numberOfAimingIncrements - 1)) {
      return;
    }
    aimingIndex = aimingDirection === 'UP' ? aimingIndex - 1 : aimingIndex + 1;
    worm.$patch(WeaponComponent, { aimingIndex });
    worm.$patch(ReticleComponent, { angle: degToRad(weapon.aimingIncrementsInDegrees![aimingIndex]) });
    const images = getActiveWeaponFramesBasedOnAimingPosition(worm);
    worm.$mutate(AnimationComponent, {
      images,
      frame: 0,
      durationMs: 0,
    });
    return;
  }
  // weapon does not support aiming
  worm.$patch(WeaponComponent, { isEquipped: true });
  worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE });
}

function restorePreviousAction(worm: Worm): void {
  const { $ } = worm.$copy(WormStateComponent);
  const action = $ !== undefined ? $.previous.action : WORM_ACTION.IDLE;
  worm.$patch(WormStateComponent, { action });
}

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

function UpdateWormAction(action: WORM_ACTION) {
  return ({}, {}, descriptor: PropertyDescriptor): void => {
    const fn = descriptor.value;
    descriptor.value = function (): void {
      this.__worm.$patch(WormStateComponent, { action });
      fn.apply(this, arguments);
    };
  };
}

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

function ClearStoredState({}, {}, descriptor: PropertyDescriptor): void {
  const fn = descriptor.value;
  descriptor.value = function (): void {
    if (!this.__isLeftDown && !this.__isRightDown) {
      this.__worm.$patch(WormStateComponent, { stored: undefined });
    }
    fn.apply(this, arguments);
  };
}

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
