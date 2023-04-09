import { IImage } from '@plasmastrapi/engine';
import { IPoint, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent, VelocityComponent } from '@plasmastrapi/physics';
import { GLOBAL } from 'app/CONSTANTS';
import AnimationComponent from 'app/components/AnimationComponent';
import FacingComponent from 'app/components/FacingComponent';

const images: IImage[] = [];
for (let i = 0, L = 900; i < L; i += 60) {
  images.push({
    src: './assets/wwalk.png',
    crop: { sourceX: 0, sourceY: i, sourceWidth: 60, sourceHeight: 60 },
    offset: { x: -30, y: -40 },
    width: 60,
    height: 60,
    zIndex: 0,
  });
}

export default class Worm extends HTML5CanvasElement {
  public constructor({ x, y }: IPoint) {
    super();
    this.$add(PoseComponent, { x, y, a: 0 });
    this.$add(ShapeComponent, {
      vertices: [
        { x: -5, y: 0 },
        { x: -5, y: -22 },
        { x: 5, y: -22 },
        { x: 5, y: 0 },
      ],
    });
    this.$add(AnimationComponent, {
      images,
      frame: 0,
      isPaused: true,
      isReversed: false,
      durationMs: 30,
    });
    this.$add(FacingComponent, { direction: 'LEFT' });
    this.$add(VelocityComponent, { x: 100, y: 0, w: 0 });
    this.$add(AccelerationComponent, { x: 0, y: GLOBAL.ACCELERATION, w: 0 });
  }
}
