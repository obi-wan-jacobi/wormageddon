/* eslint-disable no-extra-boolean-cast */
import { LevelComponent } from '@plasmastrapi/common';
import { IComponentMaster, IEntityMaster, System } from '@plasmastrapi/ecs';
import { Vector, PoseComponent } from '@plasmastrapi/geometry';
import { VelocityComponent } from '@plasmastrapi/physics';
import { IViewport } from '@plasmastrapi/viewport';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { getPenetrationDepthWithLevelBasedOnMotion } from 'app/utils';

export default class PikumaSystem extends System {
  public once({
    entities,
    components,
    deltaTime,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    deltaTime: number;
    viewport: IViewport;
  }): void {
    entities.forEvery(Worm)((worm) => {
      const { x, y, a, $ } = worm.$copy(PoseComponent);
      const prevPose = $!.previous;
      const nextPose = { x, y, a };
      const u = Vector.normalizeFromPoints(prevPose, nextPose);
      components.forEvery(LevelComponent)((levelComponent) => {
        const level = levelComponent.$entity;
        const penetration = getPenetrationDepthWithLevelBasedOnMotion(worm, level);
        if (penetration === undefined) {
          return;
        }
        const resolutionDistance = penetration + 0.1;
        const resolvedPose = {
          x: nextPose.x - u.direction.x * resolutionDistance,
          y: nextPose.y - u.direction.y * resolutionDistance,
          a: nextPose.a,
        };
        worm.$patch(PoseComponent, resolvedPose);
        worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
        if ([WORM_ACTION.ARC, WORM_ACTION.AIR, WORM_ACTION.FALL].includes(worm.$copy(WormStateComponent).action)) {
          worm.$patch(WormStateComponent, { action: WORM_ACTION.LAND });
        }
      });
    });
  }
}
