import { IComponentMaster, IEntityMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
import { IPose, fromPointsToGeoJSON, fromShapeToGeoJSON, transformShape } from '@plasmastrapi/geometry';
import { IVelocity, VelocityComponent } from '@plasmastrapi/physics';
import { GLOBAL } from 'app/CONSTANTS';
import LevelComponent from 'app/components/LevelComponent';
import Worm from 'app/entities/Worm';
const lineIntersect = require('@turf/line-intersect').default;

export default class VelocitySystem extends System {
  public once({ entities, components, delta }: { entities: IEntityMaster; components: IComponentMaster; delta: number }): void {
    entities.forEvery(Worm)((worm) => {
      const v = worm.$copy(VelocityComponent)!;
      const pose = worm.$copy(PoseComponent)!;
      const nextPose = getNextPose({ v, pose, dt: delta });
      // don't know why this is necessary... but it is...
      nextPose.x = Math.round(nextPose.x);
      nextPose.y = Math.round(nextPose.y);
      // ....
      const motionPath = fromPointsToGeoJSON([pose, nextPose]);
      let isLevelIntersection = false;
      components.forEvery(LevelComponent)((levelComponent) => {
        if (isLevelIntersection) {
          return;
        }
        const level = levelComponent.$entity;
        const levelPose = level.$copy(PoseComponent)!;
        const levelShape = level.$copy(ShapeComponent)!;
        const levelGeoJSON = fromShapeToGeoJSON(transformShape(levelShape, levelPose));
        const intersections = lineIntersect(levelGeoJSON, motionPath);
        if (intersections.features.length > 0) {
          [nextPose.x, nextPose.y] = intersections.features.shift().geometry.coordinates;
          nextPose.y -= GLOBAL.EPSILON;
          worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
          isLevelIntersection = true;
        }
      });
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
