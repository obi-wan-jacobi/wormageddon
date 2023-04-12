import { PoseComponent, ShapeComponent } from '@plasmastrapi/ecs';
import { IPoint } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent, VelocityComponent } from '@plasmastrapi/physics';
import { GLOBAL } from 'app/CONSTANTS';
import WormStateComponent from 'app/components/WormStateComponent';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { WORM_HEADING } from 'app/enums/WORM_HEADING';

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
    this.$add(WormStateComponent, {
      heading: WORM_HEADING.STRAIGHT,
      facing: WORM_FACING.RIGHT,
      action: WORM_ACTION.AIR,
    });
    this.$add(VelocityComponent, { x: 0, y: 0, w: 0 });
    this.$add(AccelerationComponent, { x: 0, y: GLOBAL.GRAVITY, w: 0 });
  }
}
