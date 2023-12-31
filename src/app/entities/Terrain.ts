import { LevelComponent } from '@plasmastrapi/common';
import { IPoint, IShape, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import HTML5CanvasElement from 'app/HTML5CanvasElement';

export default class Terrain extends HTML5CanvasElement {
  public constructor({ centerOfMass, shape }: { centerOfMass: IPoint; shape: IShape }) {
    super();
    this.$add(LevelComponent, {});
    this.$add(PoseComponent, { x: centerOfMass.x, y: centerOfMass.y, a: 0 });
    this.$add(ShapeComponent, shape);
  }
}
