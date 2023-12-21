import { IPoint, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent, GravityComponent, PhysicalComponent, VelocityComponent } from '@plasmastrapi/physics';
import { CONSTANTS } from 'app/CONSTANTS';
import ReticleComponent from 'app/components/ReticleComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { WORM_HEADING } from 'app/enums/WORM_HEADING';
import { buildFrames } from 'app/helpers/helpers';

export default class Worm extends HTML5CanvasElement {
  public constructor({ x, y }: IPoint) {
    super();
    this.$add(PoseComponent, { x, y, a: 0 });
    this.$add(ShapeComponent, {
      vertices: [
        { x: -CONSTANTS.WORM_WIDTH / 2, y: CONSTANTS.WORM_HEIGHT / 2 },
        { x: -CONSTANTS.WORM_WIDTH / 2, y: -CONSTANTS.WORM_HEIGHT / 2 },
        { x: CONSTANTS.WORM_WIDTH / 2, y: -CONSTANTS.WORM_HEIGHT / 2 },
        { x: CONSTANTS.WORM_WIDTH / 2, y: CONSTANTS.WORM_HEIGHT / 2 },
      ],
    });
    this.$add(WormStateComponent, {
      heading: WORM_HEADING.STRAIGHT,
      facing: WORM_FACING.RIGHT,
      action: WORM_ACTION.AIR,
    });
    this.$add(PhysicalComponent, { mass: 1, invMass: 1, I: 1, invI: 1 });
    this.$add(VelocityComponent, { x: 0, y: 0, w: 0 });
    this.$add(AccelerationComponent, { x: 0, y: 0, w: 0 });
    this.$add(GravityComponent, { x: 0, y: CONSTANTS.GRAVITY });
    this.$add(ReticleComponent, {
      angle: 0,
      distance: 50,
      images: buildFrames('./assets/crshairr.png', 60, 60, 1920, { x: -30, y: -30 }),
      offset: { x: 0, y: -CONSTANTS.WORM_HEIGHT / 2 },
    });
  }
}
