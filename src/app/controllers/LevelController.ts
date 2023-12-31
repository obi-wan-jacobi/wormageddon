import { LevelComponent } from '@plasmastrapi/common';
import { PoseComponent, Rectangle, Shape, ShapeComponent } from '@plasmastrapi/geometry';
import { HTML5CanvasElement, IController } from '@plasmastrapi/html5-canvas';
import Terrain from 'app/entities/Terrain';
import { app } from 'app/main';

export default class LevelController implements IController {
  public init(): void {
    // new Terrain({
    //   centerOfMass: { x: 95, y: 200 },
    //   shape: Rectangle.create(0.05, 0.05),
    // });
    const position1 = { x: app.viewport.width / 2, y: app.viewport.height / 2 - 100 };
    const shape1 = {
      vertices: [
        { x: -600, y: -50 },

        { x: -570.025, y: -50 },
        { x: -585.03, y: -55 },
        { x: -550.02, y: -50 },

        { x: -550, y: -50 },

        { x: -545.025, y: -45 },
        { x: -545.05, y: -45.2 },
        { x: -545.05, y: -45 },

        { x: -500, y: 0 },
        { x: -500, y: -50 },
        { x: -400, y: -50 },
        { x: -390, y: -100 },
        { x: -380, y: -50 },
        { x: -300, y: -50 },
        { x: -295, y: -150 },
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
    };
    console.log(Shape.transform(shape1, Object.assign({}, position1, { a: 0 })).vertices[2]);
    new Terrain({ centerOfMass: position1, shape: shape1 });
    const position2 = { x: 150, y: 50, a: 0 };
    const shape2 = {
      vertices: [
        { x: -50, y: -10 },
        { x: 500, y: -10 },
        { x: 500, y: 10 },
        { x: -50, y: 10 },
      ],
    };
    new Terrain({ centerOfMass: position2, shape: shape2 });
  }
}
