import { IComponentMaster, RenderingSystem } from '@plasmastrapi/ecs';
import { PoseComponent } from '@plasmastrapi/geometry';
import { StyleComponent } from '@plasmastrapi/graphics';
import { IViewport } from '@plasmastrapi/viewport';
import ReticleComponent from 'app/components/ReticleComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export default class ReticleSystem extends RenderingSystem {
  public draw({ components, viewport }: { components: IComponentMaster; viewport: IViewport }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const { action, facing } = wsComponent.copy();
      if (action !== WORM_ACTION.AIM) {
        return;
      }
      const worm = wsComponent.$entity as Worm;
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      const { distance, angle, offset, images } = worm.$copy(ReticleComponent);
      const p = worm.$copy(PoseComponent);
      const x = p.x + offset.x + f * (distance * Math.cos(angle));
      const y = p.y + offset.y + distance * Math.sin(angle);
      const image = images[0];
      const style = wsComponent.$entity.$copy(StyleComponent);
      viewport.drawImage({ pose: { x, y, a: 0 }, image, style });
    });
  }
}
