import { IComponentMaster, PoseComponent } from '@plasmastrapi/ecs';
import { RenderingSystem } from '@plasmastrapi/engine';
import { IViewport } from '@plasmastrapi/viewport';
import ReticleComponent from 'app/components/ReticleComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export default class WormReticleSystem extends RenderingSystem {
  public draw({ components, viewport }: { components: IComponentMaster; viewport: IViewport<any> }): void {
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
      viewport.drawImage({ pose: { x, y, a: 0 }, image });
      viewport.drawCircle({
        position: { x, y },
        radius: 2,
        style: { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 },
      });
    });
  }
}
