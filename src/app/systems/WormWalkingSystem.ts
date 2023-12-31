import { LevelComponent } from '@plasmastrapi/common';
import { IComponentMaster, IEntity, System } from '@plasmastrapi/ecs';
import { PoseComponent, IEdgesIntersection, ShapeComponent, IPose, Shape, Edge } from '@plasmastrapi/geometry';
import { IViewport } from '@plasmastrapi/viewport';
import { CONSTANTS } from 'app/CONSTANTS';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import {
  STYLE_GREEN,
  STYLE_RED,
  getClosestIntersectionWithLevelBasedOnDifferentStartAndEndShapes as getFirstUnobstructedIntersectionWithLevelBasedOnDifferentStartAndEndShapes,
  getHighestIntersectionWithinWormRangeOfMotion,
  getLevelEdges,
  getPenetrationDepthWithLevelBasedOnDifferentStartAndEndShapes as getPenetrationDepthWithLevelBasedOnExplicitStartAndEndShapes,
  getVerticalLineIntersectionsWithLevel,
  highlightPoint,
  highlightShape,
} from 'app/utils';

export default class WormWalkingSystem extends System {
  public once({
    components,
    viewport,
    deltaTime,
  }: {
    components: IComponentMaster;
    viewport: IViewport;
    deltaTime: number;
  }): void {
    const wormWalkingStepLength = CONSTANTS.WORM.WALKING_STEP_LENGTH;
    components.forEvery(WormStateComponent)((wsComponent) => {
      const { facing, action } = wsComponent.copy();
      // if (action !== WORM_ACTION.WALK) {
      //   return;
      // }
      const worm = wsComponent.$entity as Worm;
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      const pose = worm.$copy(PoseComponent);
      const laterallyDirectedWalkingStepLength = f * wormWalkingStepLength;
      const bottomOfWorm = {
        x: pose.x,
        y: pose.y + CONSTANTS.WORM.HALF_HEIGHT,
      };
      const originForVerticalLineTest = {
        x: bottomOfWorm.x + laterallyDirectedWalkingStepLength,
        y: bottomOfWorm.y,
      };
      // determine highest vertical intersection at the walking step length location
      let totalVerticalIntersections: IEdgesIntersection[] = [];
      const totalLevelEdges: Edge[][] = [];
      const totalLevels: IEntity[] = [];
      components.forEvery(LevelComponent)((levelComponent) => {
        const levelEdges = getLevelEdges(levelComponent);
        const verticalIntersections = getVerticalLineIntersectionsWithLevel(originForVerticalLineTest, levelEdges);
        totalVerticalIntersections = [...totalVerticalIntersections, ...verticalIntersections];
        totalLevelEdges.push(levelEdges);
        totalLevels.push(levelComponent.$entity);
      });
      const highestVerticalIntersectionWithinRangeOfMotion = getHighestIntersectionWithinWormRangeOfMotion(
        bottomOfWorm,
        totalVerticalIntersections,
      );
      let nextPose: IPose;
      // if there is a highest vertical intersection within range of motion, move to that point
      if (highestVerticalIntersectionWithinRangeOfMotion !== undefined) {
        nextPose = {
          x: highestVerticalIntersectionWithinRangeOfMotion.point.x,
          y:
            highestVerticalIntersectionWithinRangeOfMotion.point.y -
            CONSTANTS.WORM.HALF_HEIGHT -
            CONSTANTS.WORM.COLLISION_RESOLUTION_DISTANCE_BUFFER,
          a: pose.a,
        };
      } else {
        // otherwise, just move forward by the walking step length
        nextPose = {
          x: pose.x + laterallyDirectedWalkingStepLength,
          y: pose.y,
          a: pose.a,
        };
      }
      const baseCollisionMask = worm.$copy(ShapeComponent);
      const nextCollisionMask = baseCollisionMask;
      // check whether we're colliding with anything from our starting pose to the next pose
      const closestLateralIntersection = totalLevels
        .map((level) =>
          getFirstUnobstructedIntersectionWithLevelBasedOnDifferentStartAndEndShapes(
            pose,
            baseCollisionMask,
            nextPose,
            nextCollisionMask,
            level,
            viewport,
          ),
        )
        .filter((intersection) => intersection !== undefined)
        .reduce(
          (prev, curr) => {
            return prev.distance < curr!.distance ? prev : curr;
          },
          { distance: Infinity, point: { x: Infinity, y: Infinity } },
        );
      // if we are colliding with something, move to the highest point of the obstruction that's within our max step height
      if (closestLateralIntersection!.distance !== Infinity) {
        console.log(closestLateralIntersection!.point);
        const closestVerticalIntersections = totalLevelEdges
          .map((levelEdges) => getVerticalLineIntersectionsWithLevel(closestLateralIntersection!.point, levelEdges))
          .flat()
          .filter((intersection) => intersection !== undefined);
        console.log(closestVerticalIntersections.map((intersection) => intersection.point));
        const closestAndHighestVerticalIntersectionWithinRangeOfMotion = getHighestIntersectionWithinWormRangeOfMotion(
          bottomOfWorm,
          closestVerticalIntersections,
        );
        if (closestAndHighestVerticalIntersectionWithinRangeOfMotion !== undefined) {
          highlightPoint(viewport, closestAndHighestVerticalIntersectionWithinRangeOfMotion.point, STYLE_RED);
          console.log(closestAndHighestVerticalIntersectionWithinRangeOfMotion.point);
          nextPose = {
            x: closestAndHighestVerticalIntersectionWithinRangeOfMotion.point.x,
            y:
              closestAndHighestVerticalIntersectionWithinRangeOfMotion.point.y -
              CONSTANTS.WORM.HALF_HEIGHT -
              CONSTANTS.WORM.COLLISION_RESOLUTION_DISTANCE_BUFFER,
            a: pose.a,
          };
        } else {
          nextPose = {
            x: closestLateralIntersection!.point.x,
            y:
              closestLateralIntersection!.point.y -
              CONSTANTS.WORM.HALF_HEIGHT -
              CONSTANTS.WORM.COLLISION_RESOLUTION_DISTANCE_BUFFER,
            a: pose.a,
          };
        }
      }
      // const baseCollisionMask = {
      //   vertices: [
      //     { x: -0.05, y: -CONSTANTS.WORM.HALF_HEIGHT },
      //     { x: 0.05, y: -CONSTANTS.WORM.HALF_HEIGHT },
      //     { x: 0, y: CONSTANTS.WORM.HALF_HEIGHT - CONSTANTS.WORM.MAX_VERTICAL_STEP_HEIGHT },
      //   ],
      // };
      // let nextCollisionMask = worm.$copy(ShapeComponent);
      // if (nextPose.y > pose.y) {
      //   nextCollisionMask = baseCollisionMask;
      // }
      // check again whether we're colliding with anything from our starting pose to the next pose
      // at this point we shouldn't be
      const penetrations = totalLevels.map((level) =>
        getPenetrationDepthWithLevelBasedOnExplicitStartAndEndShapes(
          pose,
          baseCollisionMask,
          nextPose,
          nextCollisionMask,
          level,
          viewport,
        ),
      );
      if (action !== WORM_ACTION.WALK) {
        return;
      }
      if (penetrations.some((penetration) => penetration !== undefined && penetration > 0)) {
        // go idle, we're facing a wall
        worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE, stored: undefined });
        return;
      }
      if (highestVerticalIntersectionWithinRangeOfMotion === undefined) {
        // start falling, we're standing over empty space
        worm.$patch(WormStateComponent, { action: WORM_ACTION.FALL });
      }
      worm.$patch(PoseComponent, nextPose);
    });
  }
}
