import { IComponentMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
import { fromPointsToGeoJSON, fromShapeToGeoJSON, getAngleBetweenPoints, transformShape } from '@plasmastrapi/geometry';
import { LevelComponent } from '@plasmastrapi/physics';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { WORM_HEADING } from 'app/enums/WORM_HEADING';
const lineIntersect = require('@turf/line-intersect').default;

export default class WormHeadingSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const worm = wsComponent.$entity as Worm;
      const heading = getWormHeading(worm, components);
      worm.$patch(WormStateComponent, { heading });
    });
  }
}

export function getWormHeading(worm: Worm, components: IComponentMaster): WORM_HEADING {
  let heading = WORM_HEADING.STRAIGHT;
  const pose = worm.$copy(PoseComponent);
  const { facing } = worm.$copy(WormStateComponent);
  const f = facing === WORM_FACING.RIGHT ? 1 : -1;
  // throw a vertical line behind us, find the first intersection if one exists, then set heading away from that point
  const throwDistance = 5;
  const steepnessThreshold = 100;
  const verticalLine = fromPointsToGeoJSON([
    { x: pose.x - f * throwDistance, y: pose.y - steepnessThreshold },
    { x: pose.x - f * throwDistance, y: pose.y + steepnessThreshold },
  ]);
  let isLevelIntersection = false;
  components.forEvery(LevelComponent)((levelComponent) => {
    if (isLevelIntersection) {
      return;
    }
    const level = levelComponent.$entity;
    const levelPose = level.$copy(PoseComponent);
    const levelShape = level.$copy(ShapeComponent);
    const levelGeoJSON = fromShapeToGeoJSON(transformShape(levelShape, levelPose));
    const intersections = lineIntersect(levelGeoJSON, verticalLine);
    if (intersections.features.length > 0) {
      const [x, y] = intersections.features.shift().geometry.coordinates;
      const angle = getAngleBetweenPoints({ x, y }, pose);
      if (angle < 2.85 && angle > 0.2915) {
        heading = WORM_HEADING.DOWN;
      } else if (angle > -2.7 && angle < -0.4415) {
        heading = WORM_HEADING.UP;
      }
      isLevelIntersection = true;
      return;
    }
  });
  return heading;
}
