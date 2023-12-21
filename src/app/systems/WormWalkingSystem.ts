import { LevelComponent } from '@plasmastrapi/common';
import { IComponentMaster, System } from '@plasmastrapi/ecs';
import { Vector, PoseComponent, IPoint, IEdgesIntersection } from '@plasmastrapi/geometry';
import { CONSTANTS } from 'app/CONSTANTS';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { getVerticalLineIntersectionsWithLevel } from 'app/utils';

export default class WormWalkingSystem extends System {
  public once({ components }: { components: IComponentMaster; deltaTime: number }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const { facing, action } = wsComponent.copy();
      if (action !== WORM_ACTION.WALK) {
        return;
      }
      const worm = wsComponent.$entity as Worm;
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      const pose = worm.$copy(PoseComponent);
      const lateralMotionDistance = f * 0.5;
      const footLocation = {
        x: pose.x + (f * CONSTANTS.WORM_WIDTH) / 2,
        y: pose.y + CONSTANTS.WORM_HEIGHT / 2,
      };
      const origin = {
        x: footLocation.x + lateralMotionDistance,
        y: footLocation.y,
      };
      let totalIntersections: IEdgesIntersection[] = [];
      components.forEvery(LevelComponent)((levelComponent) => {
        const intersections = getVerticalLineIntersectionsWithLevel(origin, levelComponent.$entity);
        if (intersections) {
          totalIntersections = [...totalIntersections, ...intersections];
        }
      });
      const highestIntersectionWithinRangeOfMotion = totalIntersections
        .filter((intersection) => intersection.distance <= 5)
        .reduce(
          (prev, curr) => {
            return curr.point.y < prev.point.y ? curr : prev;
          },
          { point: { x: 0, y: Infinity } },
        );
      if (highestIntersectionWithinRangeOfMotion && highestIntersectionWithinRangeOfMotion.point.y !== Infinity) {
        const u = Vector.normalizeFromPoints(footLocation, highestIntersectionWithinRangeOfMotion.point);
        const nextPose = {
          x: pose.x + u.direction.x * u.magnitude,
          y: pose.y + u.direction.y * u.magnitude,
          a: pose.a,
        };
        worm.$patch(PoseComponent, nextPose);
        return;
      }
      if (totalIntersections.length === 0) {
        const nextPose = {
          x: pose.x + lateralMotionDistance,
          y: pose.y,
          a: pose.a,
        };
        worm.$patch(PoseComponent, nextPose);
        return;
      }
      const highestIntersection = totalIntersections.reduce(
        (prev, curr) => {
          return curr.point.y < prev.point.y ? curr : prev;
        },
        { point: { x: 0, y: Infinity } },
      );
      if (highestIntersection.point.y < origin.y) {
        // do nothing, we're facing a wall
        return;
      }
      const nextPose = {
        x: pose.x + lateralMotionDistance,
        y: pose.y,
        a: pose.a,
      };
      worm.$patch(PoseComponent, nextPose);
    });
  }
}
