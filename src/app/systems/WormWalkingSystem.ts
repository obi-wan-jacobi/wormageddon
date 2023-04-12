import { IComponentMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
import { fromPointsToGeoJSON, fromShapeToGeoJSON, getDirectionVectorAB, transformShape } from '@plasmastrapi/geometry';
import { VelocityComponent } from '@plasmastrapi/physics';
import { GLOBAL } from 'app/CONSTANTS';
import LevelComponent from 'app/components/LevelComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
const lineIntersect = require('@turf/line-intersect').default;

export default class WormWalkingSystem extends System {
  public once({ components, delta }: { components: IComponentMaster; delta: number }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const { facing, action, $ } = wsComponent.copy();
      if (action !== WORM_ACTION.WALK) {
        return;
      }
      if ($?.tNextStep && $.tNextStep > Date.now()) {
        return;
      }
      const worm = wsComponent.$entity as Worm;
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      const pose = worm.$copy(PoseComponent)!;
      const speed = 100;
      const stepSize = (speed * delta) / 1000;
      const nextPose = { x: pose.x + f * stepSize, y: pose.y, a: pose.a };
      // throw a vertical line forward, find the first intersection if one exists, then move a step in that direction
      const steepnessThreshold = 10;
      const verticalLine = fromPointsToGeoJSON([
        { x: nextPose.x, y: nextPose.y - steepnessThreshold },
        { x: nextPose.x, y: nextPose.y + steepnessThreshold },
      ]);
      let isLevelIntersection = false;
      components.forEvery(LevelComponent)((levelComponent) => {
        if (isLevelIntersection) {
          return;
        }
        const level = levelComponent.$entity;
        const levelPose = level.$copy(PoseComponent)!;
        const levelShape = level.$copy(ShapeComponent)!;
        const levelGeoJSON = fromShapeToGeoJSON(transformShape(levelShape, levelPose));
        const intersections = lineIntersect(levelGeoJSON, verticalLine);
        if (intersections.features.length > 0) {
          const [x, y] = intersections.features.shift().geometry.coordinates;
          const uVector = getDirectionVectorAB(pose, { x, y });
          nextPose.x = pose.x + uVector.x * stepSize;
          nextPose.y = pose.y + uVector.y * stepSize;
          nextPose.y -= GLOBAL.EPSILON;
          isLevelIntersection = true;
          return;
        }
      });
      // otherwise give a nudge and fall
      if (!isLevelIntersection) {
        worm.$patch(WormStateComponent, { action: WORM_ACTION.AIR });
        worm.$patch(VelocityComponent, { x: f * speed });
      }
      worm.$patch(PoseComponent, nextPose);
      worm.$patch(WormStateComponent, { $: { tNextStep: Date.now() + 30 } });
    });
  }
}
