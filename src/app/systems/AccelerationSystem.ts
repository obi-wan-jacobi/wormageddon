import { IComponentMaster, System } from '@plasmastrapi/ecs';
import { AccelerationComponent, VelocityComponent } from '@plasmastrapi/physics';

export default class AccelerationSystem extends System {
  public once({ components, delta }: { components: IComponentMaster; delta: number }): void {
    components.forEvery(AccelerationComponent)((acceleration) => {
      const a = acceleration.copy();
      const v = acceleration.$entity.$copy(VelocityComponent)!;
      const dt = delta;
      const entity = acceleration.$entity;
      entity.$patch(VelocityComponent, {
        x: v.x + (a.x * dt) / 1000,
        y: v.y + (a.y * dt) / 1000,
        w: v.w + (a.w * dt) / 1000,
      });
    });
  }
}
