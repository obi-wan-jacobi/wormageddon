import { IComponentMaster, RenderingSystem } from '@plasmastrapi/ecs';
import { PoseComponent } from '@plasmastrapi/geometry';
import { VelocityComponent } from '@plasmastrapi/physics';
import { COLOUR, IViewport } from '@plasmastrapi/viewport';

export default class VisualsSystem extends RenderingSystem {
  public draw({ components, viewport }: { components: IComponentMaster; viewport: IViewport }): void {
    components.forEvery(VelocityComponent)((velocityComponent) => {
      const entity = velocityComponent.$entity;
      const pose = entity.$copy(PoseComponent);
      const velocity = velocityComponent.copy();
      viewport.drawLine({
        path: [pose, { x: pose.x + velocity.x, y: pose.y + velocity.y }],
        style: { colour: COLOUR.RGBA_RED, fill: '', opacity: 1, zIndex: 9999 },
      });
    });
  }
}
