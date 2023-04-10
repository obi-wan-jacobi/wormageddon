import { Index } from '@plasmastrapi/base';
import { IComponentMaster, System } from '@plasmastrapi/ecs';
import { IImage } from '@plasmastrapi/engine';
import { VelocityComponent } from '@plasmastrapi/physics';
import AnimationComponent from 'app/components/AnimationComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export default class WormStateSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const worm = wsComponent.$entity;
      const { facing, action, stored, previous } = wsComponent.copy();
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      const fSuffix = facing === WORM_FACING.RIGHT ? 'R' : 'L';
      if (facing === previous?.facing && action === previous?.action) {
        if (action === WORM_ACTION.WALK) {
          worm.$patch(VelocityComponent, { x: f * 60, y: -10, w: 0 });
          return;
        }
        if (action === WORM_ACTION.JUMP) {
          if ((wsComponent as Index<any>).__t <= Date.now()) {
            worm.$patch(WormStateComponent, { action: WORM_ACTION.AIR });
          }
          return;
        }
        const velocity = worm.$copy(VelocityComponent)!;
        if (velocity.x === 0 && velocity.y === 0 && velocity.w === 0) {
          worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE });
          return;
        }
        return;
      }
      worm.$patch(WormStateComponent, { facing, action, previous: { facing, action } });
      if (action === WORM_ACTION.IDLE) {
        if (stored) {
          worm.$patch(WormStateComponent, { facing: stored.facing, action: stored.action });
          return;
        }
        worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wbrth1${fSuffix}.png`, 60, 60, 1200),
          frame: 0,
          isRollback: true,
          durationMs: 30,
        });
        return;
      }
      if (action === WORM_ACTION.WALK) {
        worm.$patch(VelocityComponent, { x: f * 60, y: -10, w: 0 });
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wwalk${fSuffix}.png`, 60, 60, 900, f * 0.667),
          frame: 0,
          durationMs: 30,
        });
        return;
      }
      if (action == WORM_ACTION.JUMP) {
        (wsComponent as Index<any>).__t = Date.now() + 200;
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wjump${fSuffix}.png`, 60, 60, 600),
          frame: 0,
          durationMs: 20,
        });
        return;
      }
      if (action == WORM_ACTION.AIR) {
        worm.$patch(VelocityComponent, { x: f * 300, y: -200, w: 0 });
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wwalk${fSuffix}.png`, 60, 60, 60),
          frame: 0,
          durationMs: 10,
        });
        return;
      }
    });
  }
}

function buildFrames(src: string, frameWidth: number, frameHeight: number, imageHeight: number, offsetCreep = 0): IImage[] {
  const images: IImage[] = [];
  for (let i = 0, L = imageHeight; i < L; i += frameHeight) {
    images.push({
      src,
      crop: { sourceX: 0, sourceY: i, sourceWidth: frameWidth, sourceHeight: frameHeight },
      offset: { x: -30 - (offsetCreep * i) / frameHeight, y: -42 },
      width: frameWidth,
      height: frameHeight,
      zIndex: 0,
    });
  }
  return images;
}
