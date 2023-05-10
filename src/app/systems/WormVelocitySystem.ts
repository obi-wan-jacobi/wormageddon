import { IComponentMaster, IEntityMaster, PoseComponent, System } from '@plasmastrapi/ecs';
import { IPoint, Vector, fromPointsToGeoJSON } from '@plasmastrapi/geometry';
import { IVelocity, LevelComponent, VelocityComponent, getNextPose } from '@plasmastrapi/physics';
import { IViewport } from '@plasmastrapi/viewport';
import { CONSTANTS } from 'app/CONSTANTS';
import Worm from 'app/entities/Worm';
import WormStateComponent from 'app/components/WormStateComponent';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { findLevelIntersectionsWithLine, getResultantVelocityAfterCollision } from '@plasmastrapi/helpers';
import { clamp } from '@plasmastrapi/math';
import { isShallowEqual } from '@plasmastrapi/base';

export default class WormVelocitySystem extends System {
  public once({
    entities,
    components,
    delta,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    delta: number;
    viewport: IViewport<any>;
  }): void {
    entities.forEvery(Worm)((worm) => {
      const v = Vector.normalize(worm.$copy(VelocityComponent));
      const { x, y, $ } = worm.$copy(PoseComponent);
      const { action } = worm.$copy(WormStateComponent);
      let nextPose = { x, y };
      let prevPose = $!.previous;
      let motionPath = fromPointsToGeoJSON([prevPose, nextPose]);
      let isLevelIntersection = false;
      let vNext = Vector.expand(v);
      const cFriction = 0;
      const cRestitution = 0;
      components.forEvery(LevelComponent)((levelComponent) => {
        if (isLevelIntersection) {
          return;
        }
        let intersections = findLevelIntersectionsWithLine(levelComponent, motionPath);
        if (intersections.features.length > 0) {
          const [x, y] = intersections.features[0].geometry.coordinates;
          if (isShallowEqual({ x: prevPose.x, y: prevPose.y }, { x, y }, true)) {
            // we've landed!
            vNext = getResultantVelocityAfterCollision({
              levelComponent,
              pointOfCollision: { x, y },
              velocityVector: v,
              cFriction,
              cRestitution,
            });
            prevPose = { x, y: y - CONSTANTS.EPSILON, a: 0 };
            nextPose = getNextPose({
              velocity: { x: vNext.x, y: vNext.y, w: 0 },
              pose: prevPose,
              dt: delta,
            });
            motionPath = fromPointsToGeoJSON([prevPose, nextPose]);
            intersections = findLevelIntersectionsWithLine(levelComponent, motionPath);
            if (intersections.features.length > 0) {
              [nextPose.x, nextPose.y] = intersections.features[0].geometry.coordinates;
            }
          } else {
            [nextPose.x, nextPose.y] = [x, y];
            vNext = getResultantVelocityAfterCollision({
              levelComponent,
              pointOfCollision: { x, y },
              velocityVector: v,
              cFriction,
              cRestitution,
            });
          }
          isLevelIntersection = true;
        }
      });
      nextPose.y -= CONSTANTS.EPSILON;
      [vNext.x, vNext.y] = [clamp(vNext.x, 0, 0.05), clamp(vNext.y, 0, 0.05)];
      worm.$patch(VelocityComponent, { x: vNext.x, y: vNext.y });
      // worm.$patch(PoseComponent, nextPose);
      // diagnostics(viewport, nextPose, { x: vNext.x, y: vNext.y, w: 0 });
    });
  }
}

function diagnostics(viewport: IViewport<any>, p: IPoint, v: IVelocity): void {
  viewport.drawLine({
    path: [
      { x: p.x, y: p.y },
      { x: p.x + 10 * v.x, y: p.y + 10 * v.y },
    ],
    style: { colour: 'lightgreen', fill: '', opacity: 1, zIndex: 9999 },
  });
}
