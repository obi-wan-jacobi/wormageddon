import { Void } from '@plasmastrapi/base';
import { IComponentMaster, System } from '@plasmastrapi/ecs';
import { AnimationComponent } from '@plasmastrapi/graphics';
import { VelocityComponent } from '@plasmastrapi/physics';
import { IImage } from '@plasmastrapi/viewport';
import WeaponComponent from 'app/components/WeaponComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { buildFrames } from 'app/helpers/helpers';

export default class WormStateSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const worm = wsComponent.$entity as Worm;
      const { heading, facing, action, tNextAction, $ } = wsComponent.copy();
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      if (heading === $?.previous.heading && facing === $.previous.facing && action === $.previous.action) {
        if (!tNextAction || tNextAction > Date.now()) {
          return;
        }
        NEXT_ACTION_MAP[action]({ worm, f, facing, heading });
      } else {
        worm.$patch(WormStateComponent, { tNextAction: undefined });
        if (ACTION_MAP[action]) {
          ACTION_MAP[action]({ worm, f, facing, heading });
        }
      }
      worm.$patch(WormStateComponent, { $: { previous: { heading, facing, action } } });
    });
  }
}

const NEXT_ACTION_MAP: { [key: string]: Void<{ worm: Worm; f: 1 | -1; facing: 'L' | 'R'; heading: '' | 'D' | 'U' }> } = {
  [WORM_ACTION.ARC]: ({ worm, facing, heading }) => {
    const { stored } = worm.$copy(WormStateComponent);
    worm.$mutate(WormStateComponent, { facing, heading, action: WORM_ACTION.AIR, stored });
  },
  [WORM_ACTION.EQUIP]: ({ worm, facing, heading }) => {
    worm.$patch(WeaponComponent, { isEquipped: true });
    worm.$mutate(WormStateComponent, { facing, heading, action: WORM_ACTION.IDLE });
  },
  [WORM_ACTION.IDLE]: ({ worm, facing, heading }) => {
    worm.$mutate(WormStateComponent, { facing, heading, action: WORM_ACTION.EQUIP });
  },
  [WORM_ACTION.JUMP]: ({ worm, f, facing, heading }) => {
    worm.$patch(VelocityComponent, { x: f * 150, y: -150, w: 0 });
    const { stored } = worm.$copy(WormStateComponent);
    worm.$mutate(WormStateComponent, { facing, heading, action: WORM_ACTION.ARC, stored });
  },
  [WORM_ACTION.LAND]: ({ worm, facing, heading }) => {
    const { stored } = worm.$copy(WormStateComponent);
    worm.$mutate(WormStateComponent, { facing, heading, action: WORM_ACTION.IDLE, stored });
  },
  [WORM_ACTION.UNEQUIP]: ({ worm, facing, heading }) => {
    worm.$remove(WeaponComponent);
    worm.$mutate(WormStateComponent, { facing, heading, action: WORM_ACTION.IDLE });
  },
};

const ACTION_MAP: { [key: string]: Void<{ worm: Worm; f: 1 | -1; facing: 'L' | 'R'; heading: '' | 'D' | 'U' }> } = {
  [WORM_ACTION.AIM]: ({ worm }) => {
    const images = getActiveWeaponFramesBasedOnAimingPosition(worm);
    worm.$patch(WeaponComponent, { isEquipped: true });
    worm.$mutate(AnimationComponent, {
      images,
      frame: 0,
      durationMs: 0,
    });
  },
  [WORM_ACTION.AIR]: ({ worm, facing }) => {
    worm.$mutate(AnimationComponent, {
      images: ACTION_FRAMES_MAP[`${WORM_ACTION.AIR}${facing}`],
      frame: 0,
      durationMs: 0,
    });
  },
  [WORM_ACTION.ARC]: ({ worm, facing }) => {
    const durationMs = 80;
    const images = ACTION_FRAMES_MAP[`${WORM_ACTION.ARC}${facing}`];
    worm.$patch(WormStateComponent, { tNextAction: Date.now() + durationMs * images.length });
    worm.$mutate(AnimationComponent, {
      images,
      frame: 0,
      durationMs,
    });
  },
  [WORM_ACTION.EQUIP]: ({ worm, facing, heading }) => {
    const weapon = worm.$copy(WeaponComponent);
    const images = weapon.images[WORM_ACTION.EQUIP][`${facing}${heading}`];
    const durationMs = 30;
    worm.$patch(WormStateComponent, { tNextAction: Date.now() + durationMs * images.length });
    worm.$mutate(AnimationComponent, {
      images,
      frame: 0,
      durationMs,
    });
  },
  [WORM_ACTION.FALL]: ({ worm, facing }) => {
    worm.$mutate(AnimationComponent, {
      images: ACTION_FRAMES_MAP[`${WORM_ACTION.FALL}${facing}`],
      frame: 0,
      durationMs: 80,
    });
  },
  [WORM_ACTION.FIRE]: ({ worm, facing }) => {
    const weapon = worm.$copy(WeaponComponent);
    const aimingIndex = weapon.aimingIndex ?? Math.round((weapon.aimingIncrementsInDegrees!.length - 1) / 2);
    const aimingAngle = weapon.aimingIncrementsInDegrees![aimingIndex];
    const heading = aimingAngle === 0 ? '' : aimingAngle > 0 ? 'D' : 'U';
    const images = weapon.images[WORM_ACTION.FIRE][`${facing}${heading}`];
    worm.$patch(WeaponComponent, { isEquipped: true });
    worm.$mutate(AnimationComponent, {
      images,
      frame: 0,
      durationMs: 30,
    });
  },
  [WORM_ACTION.IDLE]: ({ worm, facing, heading }) => {
    const { stored } = worm.$copy(WormStateComponent);
    if (stored) {
      worm.$patch(WormStateComponent, { facing: stored.facing, action: stored.action });
      return;
    }
    if (worm.$has(WeaponComponent)) {
      const weapon = worm.$copy(WeaponComponent);
      if (weapon.isEquipped) {
        const images = getActiveWeaponFramesBasedOnAimingPosition(worm);
        worm.$mutate(AnimationComponent, {
          images,
          frame: 0,
          durationMs: 0,
        });
        return;
      }
      worm.$patch(WormStateComponent, { tNextAction: Date.now() + 900 });
    }
    worm.$mutate(AnimationComponent, {
      images: ACTION_FRAMES_MAP[`${WORM_ACTION.IDLE}${facing}${heading}`],
      frame: 0,
      isRollback: true,
      durationMs: 30,
    });
  },
  [WORM_ACTION.JUMP]: ({ worm, facing, heading }) => {
    if (worm.$has(WeaponComponent)) {
      worm.$patch(WeaponComponent, { isEquipped: false });
    }
    worm.$patch(WormStateComponent, { tNextAction: Date.now() + 200 });
    worm.$mutate(AnimationComponent, {
      images: ACTION_FRAMES_MAP[`${WORM_ACTION.JUMP}${facing}${heading}`],
      frame: 0,
      durationMs: 20,
    });
  },
  [WORM_ACTION.LAND]: ({ worm, facing, heading }) => {
    const durationMs = 20;
    const images = ACTION_FRAMES_MAP[`${WORM_ACTION.LAND}${facing}${heading}`];
    worm.$patch(WormStateComponent, { tNextAction: Date.now() + durationMs * images.length });
    worm.$mutate(AnimationComponent, {
      images,
      frame: 0,
      durationMs,
    });
  },
  [WORM_ACTION.UNEQUIP]: ({ worm, facing, heading }) => {
    const weapon = worm.$copy(WeaponComponent);
    const durationMs = 30;
    const images = weapon.images[WORM_ACTION.UNEQUIP][`${facing}${heading}`];
    worm.$patch(WormStateComponent, { tNextAction: Date.now() + durationMs * images.length });
    worm.$mutate(AnimationComponent, {
      images,
      frame: 0,
      durationMs: 30,
    });
  },
  [WORM_ACTION.WALK]: ({ worm, facing, heading }) => {
    if (worm.$has(WeaponComponent)) {
      worm.$patch(WeaponComponent, { isEquipped: false });
    }
    worm.$mutate(AnimationComponent, {
      images: ACTION_FRAMES_MAP[`${WORM_ACTION.WALK}${facing}${heading}`],
      frame: 0,
      durationMs: 30,
    });
  },
};

const ACTION_FRAMES_MAP: { [key: string]: IImage[] } = {
  // air
  [`${WORM_ACTION.AIR}L`]: buildFrames('./assets/fly/wflyLD.png', 60, 60, 60, { x: -30, y: -30 }),
  [`${WORM_ACTION.AIR}R`]: buildFrames('./assets/fly/wflyRD.png', 60, 60, 60, { x: -30, y: -30 }),
  // arc
  [`${WORM_ACTION.ARC}L`]: buildFrames('./assets/arc/warcL.png', 60, 60, 420, { x: -30, y: -30 }),
  [`${WORM_ACTION.ARC}R`]: buildFrames('./assets/arc/warcR.png', 60, 60, 420, { x: -30, y: -30 }),
  // fall
  [`${WORM_ACTION.FALL}L`]: buildFrames('./assets/fall/wfallL.png', 60, 60, 120, { x: -30, y: -30 }),
  [`${WORM_ACTION.FALL}R`]: buildFrames('./assets/fall/wfallR.png', 60, 60, 120, { x: -30, y: -30 }),
  // idle
  [`${WORM_ACTION.IDLE}L`]: buildFrames('./assets/idle/wbrth1L.png', 60, 60, 1200, { x: -30, y: -30 }),
  [`${WORM_ACTION.IDLE}LD`]: buildFrames('./assets/idle/wbrth1LD.png', 60, 60, 1200, { x: -30, y: -30 }),
  [`${WORM_ACTION.IDLE}LU`]: buildFrames('./assets/idle/wbrth1LU.png', 60, 60, 1200, { x: -30, y: -30 }),
  [`${WORM_ACTION.IDLE}R`]: buildFrames('./assets/idle/wbrth1R.png', 60, 60, 1200, { x: -30, y: -30 }),
  [`${WORM_ACTION.IDLE}RD`]: buildFrames('./assets/idle/wbrth1RD.png', 60, 60, 1200, { x: -30, y: -30 }),
  [`${WORM_ACTION.IDLE}RU`]: buildFrames('./assets/idle/wbrth1RU.png', 60, 60, 1200, { x: -30, y: -30 }),
  // jump
  [`${WORM_ACTION.JUMP}L`]: buildFrames('./assets/jump/wjumpL.png', 60, 60, 600, { x: -30, y: -30 }),
  [`${WORM_ACTION.JUMP}LD`]: buildFrames('./assets/jump/wjumpLD.png', 60, 60, 600, { x: -30, y: -30 }),
  [`${WORM_ACTION.JUMP}LU`]: buildFrames('./assets/jump/wjumpLU.png', 60, 60, 600, { x: -30, y: -30 }),
  [`${WORM_ACTION.JUMP}R`]: buildFrames('./assets/jump/wjumpR.png', 60, 60, 600, { x: -30, y: -30 }),
  [`${WORM_ACTION.JUMP}RD`]: buildFrames('./assets/jump/wjumpRD.png', 60, 60, 600, { x: -30, y: -30 }),
  [`${WORM_ACTION.JUMP}RU`]: buildFrames('./assets/jump/wjumpRU.png', 60, 60, 600, { x: -30, y: -30 }),
  // land
  [`${WORM_ACTION.LAND}L`]: buildFrames('./assets/land/wland1L.png', 60, 60, 360, { x: -30, y: -30 }),
  [`${WORM_ACTION.LAND}LD`]: buildFrames('./assets/land/wland1LD.png', 60, 60, 360, { x: -30, y: -30 }),
  [`${WORM_ACTION.LAND}LU`]: buildFrames('./assets/land/wland1LU.png', 60, 60, 360, { x: -30, y: -30 }),
  [`${WORM_ACTION.LAND}R`]: buildFrames('./assets/land/wland1R.png', 60, 60, 360, { x: -30, y: -30 }),
  [`${WORM_ACTION.LAND}RD`]: buildFrames('./assets/land/wland1RD.png', 60, 60, 360, { x: -30, y: -30 }),
  [`${WORM_ACTION.LAND}RU`]: buildFrames('./assets/land/wland1RU.png', 60, 60, 360, { x: -30, y: -30 }),
  // walk
  [`${WORM_ACTION.WALK}L`]: buildFrames('./assets/walk/wwalkL.png', 60, 60, 900, { x: -30, y: -30 }, -0.667),
  [`${WORM_ACTION.WALK}LD`]: buildFrames('./assets/walk/wwalkLD.png', 60, 60, 900, { x: -30, y: -30 }, -0.667),
  [`${WORM_ACTION.WALK}LU`]: buildFrames('./assets/walk/wwalkLU.png', 60, 60, 900, { x: -30, y: -30 }, -0.667),
  [`${WORM_ACTION.WALK}R`]: buildFrames('./assets/walk/wwalkR.png', 60, 60, 900, { x: -30, y: -30 }, 0.667),
  [`${WORM_ACTION.WALK}RD`]: buildFrames('./assets/walk/wwalkRD.png', 60, 60, 900, { x: -30, y: -30 }, 0.667),
  [`${WORM_ACTION.WALK}RU`]: buildFrames('./assets/walk/wwalkRU.png', 60, 60, 900, { x: -30, y: -30 }, 0.667),
};

export function getActiveWeaponFramesBasedOnAimingPosition(worm: Worm): IImage[] {
  const weapon = worm.$copy(WeaponComponent);
  const aimingIndex = weapon.aimingIndex ?? Math.round((weapon.aimingIncrementsInDegrees!.length - 1) / 2);
  const { facing, heading } = worm.$copy(WormStateComponent);
  const images = weapon.images[WORM_ACTION.IDLE][`${facing}${heading}`];
  const frameConversionFactor = aimingIndex / (weapon.aimingIncrementsInDegrees!.length - 1);
  const activeFrameIndex = images.length - 1 - Math.round(frameConversionFactor * (images.length - 1));
  return [images[activeFrameIndex]];
}
