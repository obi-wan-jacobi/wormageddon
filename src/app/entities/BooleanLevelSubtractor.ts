import { IPose, IShape, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import HTML5CanvasElement from 'app/HTML5CanvasElement';
import BooleanLevelSubtractorComponent from 'app/components/BooleanLevelSubtractorComponent';

export default class BooleanLevelSubtractor extends HTML5CanvasElement {
  public constructor({ pose, shape }: { pose: IPose; shape: IShape }) {
    super();
    this.$add(BooleanLevelSubtractorComponent, {});
    this.$add(PoseComponent, pose);
    this.$add(ShapeComponent, shape);
  }
}
