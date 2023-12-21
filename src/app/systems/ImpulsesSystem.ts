import { IComponentMaster, IEntityMaster, ISystemMaster, System } from '@plasmastrapi/ecs';
import { PoseComponent, Vector } from '@plasmastrapi/geometry';
import { PhysicalComponent, VelocityComponent } from '@plasmastrapi/physics';
import { IViewport } from '@plasmastrapi/viewport';
import ImpulsesComponent from 'app/components/ImpulsesComponent';

export default class ImpulsesSystem extends System {
  public once({
    components,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    systems: ISystemMaster;
    deltaTime: number;
    viewport: IViewport;
  }): void {
    components.forEvery(ImpulsesComponent)((impulses) => {
      const { values } = impulses.copy();
      const entity = impulses.$entity;
      const pose = entity.$copy(PoseComponent);
      const { invI } = entity.$copy(PhysicalComponent);
      const result = values.reduce(
        (result, impulse) => {
          result.x += impulse.direction.x * impulse.magnitude;
          result.y += impulse.direction.y * impulse.magnitude;
          const r = Vector.normalizeFromPoints(impulse.origin, pose);
          result.w -= Vector.crossProduct(r, impulse) * invI;
          return result;
        },
        { x: 0, y: 0, w: 0 },
      );
      const velocity = entity.$copy(VelocityComponent);
      entity.$patch(VelocityComponent, {
        x: velocity.x + result.x,
        y: velocity.y + result.y,
        w: velocity.w + result.w,
      });
      impulses.mutate({ values: [] });
    });
  }
}
