import { LevelComponent } from '@plasmastrapi/common';
import { IComponentMaster, System } from '@plasmastrapi/ecs';
import { IEdgesIntersection, PoseComponent, Shape } from '@plasmastrapi/geometry';
import { CONSTANTS } from 'app/CONSTANTS';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { WORM_HEADING } from 'app/enums/WORM_HEADING';
import { getHighestIntersectionWithinWormRangeOfMotion, getLevelEdges, getVerticalLineIntersectionsWithLevel } from 'app/utils';

export default class WormHeadingSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const { action } = wsComponent.copy();
      if (![WORM_ACTION.WALK, WORM_ACTION.LAND].includes(action)) {
        return;
      }
      const worm = wsComponent.$entity as Worm;
      const heading = getWormHeading(worm, components);
      worm.$patch(WormStateComponent, { heading });
    });
  }
}

export function getWormHeading(worm: Worm, components: IComponentMaster): WORM_HEADING {
  const pose = worm.$copy(PoseComponent);
  const { facing } = worm.$copy(WormStateComponent);
  const f = facing === WORM_FACING.RIGHT ? 1 : -1;
  const bottomOfWorm = {
    x: pose.x,
    y: pose.y + CONSTANTS.WORM.HALF_HEIGHT,
  };
  const bottomOfWormAdjustedByMaxStepHeightForStraightness = {
    x: bottomOfWorm.x,
    y: bottomOfWorm.y - CONSTANTS.WORM.MAX_STEP_HEIGHT_FOR_STRAIGHTNESS,
  };
  const laterallyDirectedWalkingStepLength = f * CONSTANTS.WORM.WALKING_STEP_LENGTH;
  const frontOriginForVerticalLineTest = {
    x: bottomOfWorm.x + laterallyDirectedWalkingStepLength,
    y: bottomOfWorm.y,
  };
  const backOriginForVerticalLineTest = {
    x: bottomOfWorm.x - laterallyDirectedWalkingStepLength,
    y: bottomOfWorm.y,
  };
  const laterallyDirectedLateralTestLength = f * CONSTANTS.WORM.QUARTER_WIDTH;
  const frontOriginForLateralLineTest = {
    x: bottomOfWormAdjustedByMaxStepHeightForStraightness.x + laterallyDirectedLateralTestLength,
    y: bottomOfWormAdjustedByMaxStepHeightForStraightness.y,
  };
  const backOriginForLateralLineTest = {
    x: bottomOfWormAdjustedByMaxStepHeightForStraightness.x - laterallyDirectedLateralTestLength,
    y: bottomOfWormAdjustedByMaxStepHeightForStraightness.y,
  };
  let totalFrontVerticalIntersections: IEdgesIntersection[] = [];
  let totalBackVerticalIntersections: IEdgesIntersection[] = [];
  const totalFrontLateralIntersections: IEdgesIntersection[] = [];
  const totalBackLateralIntersections: IEdgesIntersection[] = [];
  components.forEvery(LevelComponent)((levelComponent) => {
    const levelEdges = getLevelEdges(levelComponent);
    const frontVerticalIntersections = getVerticalLineIntersectionsWithLevel(frontOriginForVerticalLineTest, levelEdges);
    totalFrontVerticalIntersections = [...totalFrontVerticalIntersections, ...frontVerticalIntersections];
    const backVerticalIntersections = getVerticalLineIntersectionsWithLevel(backOriginForVerticalLineTest, levelEdges);
    totalBackVerticalIntersections = [...totalBackVerticalIntersections, ...backVerticalIntersections];
    const frontLateralIntersection = Shape.findEdgeIntersection(
      bottomOfWormAdjustedByMaxStepHeightForStraightness,
      frontOriginForLateralLineTest,
      levelEdges,
    );
    if (frontLateralIntersection !== undefined) {
      totalFrontLateralIntersections.push(frontLateralIntersection);
    }
    const backLateralIntersection = Shape.findEdgeIntersection(
      bottomOfWormAdjustedByMaxStepHeightForStraightness,
      backOriginForLateralLineTest,
      levelEdges,
    );
    if (backLateralIntersection !== undefined) {
      totalBackLateralIntersections.push(backLateralIntersection);
    }
  });
  const highestFrontVerticalIntersectionWithinRangeOfMotion = getHighestIntersectionWithinWormRangeOfMotion(
    bottomOfWorm,
    totalFrontVerticalIntersections,
  );
  const highestBackVerticalIntersectionWithinRangeOfMotion = getHighestIntersectionWithinWormRangeOfMotion(
    bottomOfWorm,
    totalBackVerticalIntersections,
  );
  if (
    highestFrontVerticalIntersectionWithinRangeOfMotion === undefined &&
    highestBackVerticalIntersectionWithinRangeOfMotion === undefined
  ) {
    if (
      (totalFrontLateralIntersections.length === 0 && totalBackLateralIntersections.length === 0) ||
      (totalFrontLateralIntersections.length > 0 && totalBackLateralIntersections.length > 0)
    ) {
      return WORM_HEADING.STRAIGHT;
    }
    if (totalFrontLateralIntersections.length > 0) {
      return WORM_HEADING.UP;
    }
    return WORM_HEADING.DOWN;
  }
  if (highestFrontVerticalIntersectionWithinRangeOfMotion === undefined) {
    if (totalBackLateralIntersections.length > 0) {
      return WORM_HEADING.DOWN;
    }
    if (
      highestBackVerticalIntersectionWithinRangeOfMotion!.point.y - bottomOfWorm.y >
      CONSTANTS.WORM.MAX_STEP_HEIGHT_FOR_STRAIGHTNESS
    ) {
      return WORM_HEADING.UP;
    }
    return WORM_HEADING.STRAIGHT;
  }
  if (highestBackVerticalIntersectionWithinRangeOfMotion === undefined) {
    return WORM_HEADING.UP;
  }
  if (
    Math.abs(
      highestFrontVerticalIntersectionWithinRangeOfMotion.point.y - highestBackVerticalIntersectionWithinRangeOfMotion!.point.y,
    ) <= CONSTANTS.WORM.MAX_STEP_HEIGHT_FOR_STRAIGHTNESS
  ) {
    return WORM_HEADING.STRAIGHT;
  }
  return highestFrontVerticalIntersectionWithinRangeOfMotion.point.y < highestBackVerticalIntersectionWithinRangeOfMotion!.point.y
    ? WORM_HEADING.UP
    : WORM_HEADING.DOWN;
}
