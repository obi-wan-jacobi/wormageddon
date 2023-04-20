import { PoseComponent, ShapeComponent } from '@plasmastrapi/ecs';
import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import { LevelComponent } from '@plasmastrapi/physics';
import { app } from 'app/main';

export default class LevelController implements IController {
  private __worm: HTML5CanvasElement;

  public init(): void {
    new HTML5CanvasElement()
      .$add(LevelComponent, {})
      .$add(PoseComponent, { x: app.viewport.width / 2, y: app.viewport.height / 2, a: 0 })
      // .$add(ShapeComponent, {
      //   vertices: [
      //     { x: -600, y: 50 },
      //     { x: -600, y: -50 },
      //     { x: -500, y: -50 },
      //     { x: -400, y: -200 },
      //     // { x: -360, y: -200 },
      //     { x: -300, y: -50 },
      //     { x: 600, y: -50 },
      //     { x: 600, y: 50 },
      //   ],
      // });
      .$add(ShapeComponent, {
        vertices: [
          { x: -600, y: 50 },
          { x: -600, y: -50 },
          { x: 600, y: -50 },
          { x: 600, y: 50 },
        ],
      });

    new HTML5CanvasElement()
      .$add(LevelComponent, {})
      .$add(PoseComponent, { x: app.viewport.width / 2, y: app.viewport.height / 2, a: 0 })
      .$add(ShapeComponent, {
        vertices: [
          { x: -400, y: -90 },
          { x: -400, y: -150 },
          { x: 600, y: -150 },
          { x: 600, y: -90 },
        ],
      });
  }
}
