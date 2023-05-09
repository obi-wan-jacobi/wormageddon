import { PoseComponent } from '@plasmastrapi/ecs';
import { IPoint } from '@plasmastrapi/geometry';
import { HTML5CanvasElement } from '@plasmastrapi/html5-canvas';

export default class Handle extends HTML5CanvasElement {
  public constructor({ x, y }: IPoint) {
    super();
    this.$add(PoseComponent, { x, y, a: 0 });
  }
}
