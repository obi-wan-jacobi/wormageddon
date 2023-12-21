import { LevelComponent } from '@plasmastrapi/common';
import { PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import { app } from 'app/main';

export default class LevelController implements IController {
  public init(): void {
    new HTML5CanvasElement()
      .$add(LevelComponent, {})
      .$add(PoseComponent, { x: app.viewport.width / 2, y: app.viewport.height / 2 - 100, a: 0 })
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
      // .$add(ShapeComponent, {
      //   vertices: [
      //     { x: -600, y: 50 },
      //     { x: -600, y: -50 },
      //     { x: 600, y: -50 },
      //     { x: 600, y: 50 },
      //   ],
      // });
      .$add(ShapeComponent, {
        vertices: [
          { x: -600, y: -50 },
          { x: -400, y: -50 },
          { x: -390, y: -200 },
          { x: -380, y: -50 },
          { x: -300, y: -50 },
          { x: -290, y: -150 },
          { x: -280, y: -50 },
          { x: 200, y: -50 },
          { x: 250, y: -100 },
          { x: 300, y: -50 },
          { x: 600, y: -50 },
          { x: 600, y: 50 },
          { x: -280, y: 50 },
          { x: -290, y: 150 },
          { x: -300, y: 50 },
          { x: -600, y: 50 },
        ],
      });
    // .$add(ShapeComponent, {
    //   vertices: [
    //     { x: -10, y: -10 },
    //     { x: 10, y: -10 },
    //     { x: 10, y: 10 },
    //     { x: -10, y: 10 },
    //   ],
    // });

    // new HTML5CanvasElement()
    //   .$add(LevelComponent, {})
    //   .$add(PoseComponent, { x: app.viewport.width / 2, y: app.viewport.height / 2, a: 0 })
    //   .$add(ShapeComponent, {
    //     vertices: [
    //       { x: -400, y: -90 },
    //       { x: -400, y: -150 },
    //       { x: 600, y: -150 },
    //       { x: 600, y: -90 },
    //     ],
    //   });
  }
}
