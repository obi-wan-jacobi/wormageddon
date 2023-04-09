import { IComponentMaster, IEntityMaster, System } from '@plasmastrapi/ecs';
import {
  IPose,
  PoseComponent,
  ShapeComponent,
  entityContainsPoint,
  fromPointsToGeoJSON,
  fromShapeToGeoJSON,
  transformShape,
} from '@plasmastrapi/geometry';
import { IVelocity, VelocityComponent } from '@plasmastrapi/physics';
import LevelComponent from 'app/components/LevelComponent';
import Worm from 'app/entities/Worm';
const lineIntersect = require('@turf/line-intersect').default;

export default class VelocitySystem extends System {
  public once({ entities, components, delta }: { entities: IEntityMaster; components: IComponentMaster; delta: number }): void {
    entities.forEvery(Worm)((worm) => {
      const v = worm.$copy(VelocityComponent)!;
      const pose = worm.$copy(PoseComponent)!;
      const nextPose = getNextPose({ v, pose, dt: delta });
      const wormLine = fromPointsToGeoJSON([pose, nextPose]);
      let isLevelIntersection = false;
      components.forEvery(LevelComponent)((levelComponent) => {
        if (isLevelIntersection) {
          return;
        }
        const level = levelComponent.$entity;
        const levelPose = level.$copy(PoseComponent)!;
        const levelShape = level.$copy(ShapeComponent)!;
        const levelGeoJSON = fromShapeToGeoJSON(transformShape(levelShape, levelPose));
        const intersections = lineIntersect(levelGeoJSON, wormLine);
        if (intersections.features.length === 1 && entityContainsPoint(level, nextPose)) {
          [nextPose.x, nextPose.y] = intersections.features.shift().geometry.coordinates;
          isLevelIntersection = true;
        }
        if (intersections.features.length > 1) {
          [nextPose.x, nextPose.y] = intersections.features.shift().geometry.coordinates;
          isLevelIntersection = true;
        }
      });
      if (isLevelIntersection) {
        worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
      }
      worm.$patch(PoseComponent, nextPose);
    });
  }
}

interface IDetail {
  v: IVelocity;
  pose: IPose;
  dt: number;
}

function getNextPose(detail: IDetail): IPose {
  const { v, pose, dt } = detail;
  return {
    x: pose.x + (v.x * dt) / 1000,
    y: pose.y + (v.y * dt) / 1000,
    a: pose.a + (v.w * dt) / 1000,
  };
}
