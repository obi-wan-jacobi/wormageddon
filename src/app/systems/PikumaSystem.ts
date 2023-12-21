/* eslint-disable no-extra-boolean-cast */
import { LevelComponent } from '@plasmastrapi/common';
import { IComponentMaster, IEntityMaster, System } from '@plasmastrapi/ecs';
import { Vector, INormalizedVector, Edge, IShape, Shape, IPose, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { VelocityComponent } from '@plasmastrapi/physics';
import { COLOUR, IViewport } from '@plasmastrapi/viewport';
import Worm from 'app/entities/Worm';
import { getPenetrationDepthWithLevelBasedOnMotion } from 'app/utils';

const STYLE_GREEN = { colour: 'lightgreen', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_GREEN_BIG = { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 };
const STYLE_RED = { colour: 'red', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_RED_BIG = { colour: 'red', fill: 'red', opacity: 1, zIndex: 9999 };
const STYLE_YELLOW = { colour: 'yellow', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_BLUE = { colour: 'blue', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_WHITE = { colour: 'white', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_PINK = { colour: 'pink', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_ORANGE = { colour: 'orange', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };

export default class PikumaSystem extends System {
  public once({
    entities,
    components,
    deltaTime,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    deltaTime: number;
    viewport: IViewport;
  }): void {
    entities.forEvery(Worm)((worm) => {
      const { x, y, a, $ } = worm.$copy(PoseComponent);
      const prevPose = $!.previous;
      const nextPose = { x, y, a };
      const u = Vector.normalizeFromPoints(prevPose, nextPose);
      components.forEvery(LevelComponent)((levelComponent) => {
        const level = levelComponent.$entity;
        const penetration = getPenetrationDepthWithLevelBasedOnMotion(worm, level);
        if (penetration !== undefined) {
          const resolvedPose = {
            x: nextPose.x - u.direction.x * (penetration + 0.1),
            y: nextPose.y - u.direction.y * (penetration + 0.1),
            a: nextPose.a,
          };
          worm.$patch(PoseComponent, resolvedPose);
          worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
          return;
        }
      });
    });
  }
}
