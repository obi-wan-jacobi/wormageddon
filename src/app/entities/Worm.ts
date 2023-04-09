import { IPoint, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent, VelocityComponent } from '@plasmastrapi/physics';
import { GLOBAL } from 'app/CONSTANTS';
import WormStateComponent from 'app/components/WormStateComponent';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export default class Worm extends HTML5CanvasElement {
  public constructor({ x, y }: IPoint) {
    super();
    this.$add(PoseComponent, { x, y, a: 0 });
    this.$add(ShapeComponent, {
      vertices: [
        { x: -5, y: 0 },
        { x: -5, y: -24 },
        { x: 5, y: -24 },
        { x: 5, y: 0 },
      ],
    });
    this.$add(WormStateComponent, { action: WORM_ACTION.IDLE, facing: WORM_FACING.RIGHT });
    this.$add(VelocityComponent, { x: 0, y: 0, w: 0 });
    this.$add(AccelerationComponent, { x: 0, y: GLOBAL.ACCELERATION, w: 0 });
  }
}
