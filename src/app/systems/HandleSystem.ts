import { IComponentMaster, IEntityMaster, PoseComponent, System } from '@plasmastrapi/ecs';
import { IViewport } from '@plasmastrapi/viewport';
import Handle from 'app/entities/Handle';
import { extrude } from './WormCollisionSystem';

export default class HandleSystem extends System {
  public once({
    entities,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    delta: number;
    viewport: IViewport<any>;
  }): void {
    entities.forEvery(Handle)((handle) => {
      const testShape = {
        vertices: [
          { x: -5, y: 12 },
          { x: -5, y: -12 },
          { x: 5, y: -12 },
          { x: 5, y: 12 },
        ],
      };
      const prevPose = { x: 200, y: 200, a: 0 };
      // const nextPose = handle.$copy(PoseComponent);
      const nextPose = { x: 200, y: 200, a: 0 };
      const extrusion = extrude(testShape, prevPose, nextPose, viewport);
    });
  }
}
