import { IComponentMaster, System } from '@plasmastrapi/ecs';
import { IImage } from '@plasmastrapi/engine';
import AnimationComponent from 'app/components/AnimationComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export default class WormStateSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const { facing, action, previous } = wsComponent.copy();
      if (facing === previous?.facing && action === previous?.action) {
        return;
      }
      const worm = wsComponent.$entity;
      worm.$patch(WormStateComponent, { facing, action, previous: { facing, action } });
      const f = facing === WORM_FACING.RIGHT ? 'R' : 'L';
      if (action === WORM_ACTION.IDLE) {
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wbrth1${f}.png`, 60, 60, 1200),
          frame: 0,
          isPaused: false,
          isReversed: false,
          isRollback: true,
          durationMs: 30,
        });
        return;
      }
      if (action === WORM_ACTION.WALK) {
        const ocf = facing === WORM_FACING.RIGHT ? 1 : -1;
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wwalk${f}.png`, 60, 60, 900, ocf * 0.667),
          frame: 0,
          isPaused: false,
          isReversed: false,
          durationMs: 30,
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
