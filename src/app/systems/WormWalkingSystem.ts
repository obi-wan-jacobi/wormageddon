import { IComponentMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
import { fromPointsToGeoJSON, fromShapeToGeoJSON, getDirectionVectorAB, transformShape } from '@plasmastrapi/geometry';
import { LevelComponent, VelocityComponent } from '@plasmastrapi/physics';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
const lineIntersect = require('@turf/line-intersect').default;

export default class WormWalkingSystem extends System {
  public once({ components }: { components: IComponentMaster; delta: number }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const { facing, action } = wsComponent.copy();
      if (action !== WORM_ACTION.WALK) {
        return;
      }
      const worm = wsComponent.$entity as Worm;
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      const pose = worm.$copy(PoseComponent);
      // throw a vertical line forward, find the first intersection if one exists, then set velocity towards it
      const lateralSpeed = 50;
      const velocity = { x: f * lateralSpeed, y: 0, w: 0 };
      const throwDistance = 0.5;
      const steepnessThreshold = 100;
      const verticalLine = fromPointsToGeoJSON([
        { x: pose.x + f * throwDistance, y: pose.y - steepnessThreshold },
        { x: pose.x + f * throwDistance, y: pose.y + steepnessThreshold },
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
          const [x, y] = intersections.features[0].geometry.coordinates;
          const uVector = getDirectionVectorAB(pose, { x, y: y - 1 });
          velocity.x = uVector.x * lateralSpeed;
          velocity.y = uVector.y * lateralSpeed;
          isLevelIntersection = true;
          return;
        }
      });
      // otherwise fall
      if (!isLevelIntersection) {
        worm.$patch(WormStateComponent, { action: WORM_ACTION.AIR });
      }
      worm.$patch(VelocityComponent, velocity);
    });
  }
}
