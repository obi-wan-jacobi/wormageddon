import { IPoint, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';

export default class Atom extends HTML5CanvasElement {
  public constructor({ x, y }: IPoint) {
    super();
    this.$add(PoseComponent, { x, y, a: 0 });
    this.$add(ShapeComponent, {
      vertices: [
        { x: -5, y: 12 },
        { x: -5, y: -12 },
        { x: 5, y: -12 },
        { x: 5, y: 12 },
      ],
    });
  }
}
