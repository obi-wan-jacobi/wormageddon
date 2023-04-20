import { AnimationComponent } from '@plasmastrapi/animation';
import { Void, isShallowEqual } from '@plasmastrapi/base';
import { IComponentMaster, PoseComponent, System } from '@plasmastrapi/ecs';
import { VelocityComponent } from '@plasmastrapi/physics';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { buildFrames, isPoseEqual } from 'app/helpers/helpers';

export default class WormStateSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const worm = wsComponent.$entity as Worm;
      const { heading, facing, action, $ } = wsComponent.copy();
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      if (heading === $?.previous?.heading && facing === $.previous.facing && action === $.previous.action) {
        const pose = worm.$copy(PoseComponent);
        const velocity = worm.$copy(VelocityComponent);
        if (
          [WORM_ACTION.ARC, WORM_ACTION.AIR].includes(action) &&
          isPoseEqual(pose, pose.$!.previous, 0.005) &&
          isShallowEqual({ x: velocity.x, y: velocity.y }, { x: 0, y: 0 })
        ) {
          worm.$patch(WormStateComponent, { action: WORM_ACTION.LAND });
          return;
        }
        if (action === WORM_ACTION.JUMP) {
          if ($.tNextAction! <= Date.now()) {
            worm.$patch(VelocityComponent, { x: f * 150, y: -150, w: 0 });
            worm.$patch(WormStateComponent, { action: WORM_ACTION.ARC });
          }
          return;
        }
        if (action === WORM_ACTION.ARC) {
          if ($.tNextAction! <= Date.now()) {
            worm.$patch(WormStateComponent, { action: WORM_ACTION.AIR });
          }
          return;
        }
        if (action === WORM_ACTION.LAND) {
          if ($.tNextAction! <= Date.now()) {
            worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE });
          }
          return;
        }
        return;
      }
      worm.$patch(WormStateComponent, { facing, action, $: { previous: { heading, facing, action } } });
      if (!ACTIONS_MAP[action]) {
        return;
      }
      ACTIONS_MAP[action]({ worm, f, facing, heading });
    });
  }
}

const ACTIONS_MAP: { [key: number]: Void<{ worm: Worm; f: 1 | -1; facing: string; heading: string }> } = {
  [WORM_ACTION.IDLE]: ({ worm, facing, heading }: { worm: Worm; facing: string; heading: string }) => {
    const { stored } = worm.$copy(WormStateComponent);
    if (stored) {
      worm.$patch(WormStateComponent, { facing: stored.facing, action: stored.action });
      return;
    }
    worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
    worm.$add(AnimationComponent, {
      images: buildFrames(`./assets/idle/wbrth1${facing}${heading}.png`, 60, 60, 1200, { x: -30, y: -42 }),
      frame: 0,
      isRollback: true,
      durationMs: 30,
    });
  },
  [WORM_ACTION.WALK]: ({ worm, f, facing, heading }: { worm: Worm; f: 1 | -1; facing: string; heading: string }) => {
    worm.$add(AnimationComponent, {
      images: buildFrames(`./assets/walk/wwalk${facing}${heading}.png`, 60, 60, 900, { x: -30, y: -42 }, f * 0.667),
      frame: 0,
      durationMs: 30,
    });
  },
  [WORM_ACTION.JUMP]: ({ worm, facing, heading }: { worm: Worm; facing: string; heading: string }) => {
    worm.$patch(WormStateComponent, { $: { tNextAction: Date.now() + 200 } });
    worm.$add(AnimationComponent, {
      images: buildFrames(`./assets/jump/wjump${facing}${heading}.png`, 60, 60, 600, { x: -30, y: -42 }),
      frame: 0,
      durationMs: 20,
    });
  },
  [WORM_ACTION.ARC]: ({ worm, facing }: { worm: Worm; facing: string }) => {
    const durationMs = 80;
    worm.$patch(WormStateComponent, { $: { tNextAction: Date.now() + durationMs * 7 } });
    worm.$add(AnimationComponent, {
      images: buildFrames(`./assets/arc/warc${facing}.png`, 60, 60, 420, { x: -30, y: -42 }),
      frame: 0,
      durationMs,
    });
  },
  [WORM_ACTION.AIR]: ({ worm, facing }: { worm: Worm; facing: string }) => {
    worm.$add(AnimationComponent, {
      images: buildFrames(`./assets/fly/wfly${facing}D.png`, 60, 60, 60, { x: -30, y: -42 }),
      frame: 0,
      durationMs: 0,
    });
  },
  [WORM_ACTION.LAND]: ({ worm, facing, heading }: { worm: Worm; facing: string; heading: string }) => {
    const durationMs = 20;
    worm.$patch(WormStateComponent, { $: { tNextAction: Date.now() + durationMs * 6 } });
    worm.$add(AnimationComponent, {
      images: buildFrames(`./assets/land/wland1${facing}${heading}.png`, 60, 60, 360, { x: -30, y: -42 }),
      frame: 0,
      durationMs,
    });
  },
};
