import { PoseComponent, ShapeComponent } from '@plasmastrapi/ecs';
import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import LevelComponent from 'app/components/LevelComponent';
import { app } from 'app/main';

export default class LevelController implements IController {
  private __worm: HTML5CanvasElement;

  public init(): void {
    new HTML5CanvasElement()
      .$add(LevelComponent, {})
      .$add(PoseComponent, { x: app.viewport.width / 2, y: app.viewport.height / 2, a: 0 })
      .$add(ShapeComponent, {
        vertices: [
          { x: -600, y: 50 },
          { x: -600, y: -50 },
          { x: -500, y: -50 },
          { x: -400, y: -300 },
          { x: -300, y: -50 },
          { x: 600, y: -50 },
          { x: 600, y: 50 },
        ],
      });
  }
}
