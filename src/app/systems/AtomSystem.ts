/* eslint-disable no-extra-boolean-cast */
import { LevelComponent } from '@plasmastrapi/common';
import { IComponentMaster, IEntityMaster, System } from '@plasmastrapi/ecs';
import { Vector, Shape, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { COLOUR, IViewport } from '@plasmastrapi/viewport';
import Atom from 'app/entities/Atom';
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

export default class AtomSystem extends System {
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
    entities.forEvery(Atom)((atom) => {
      const { x, y, a } = atom.$copy(PoseComponent);
      const nextPose = { x, y, a };
      const baseAtomShape = atom.$copy(ShapeComponent);
      const u = Vector.normalizeFromPoints({ x: 0, y: 0 }, { x: 100, y: 100 });
      const projectedPose = {
        x: nextPose.x - u.direction.x * u.magnitude,
        y: nextPose.y - u.direction.y * u.magnitude,
        a: nextPose.a,
      };
      const projectedShape = Shape.transform(baseAtomShape, projectedPose);
      viewport.drawShape({ path: projectedShape.vertices, style: STYLE_GREEN });
      components.forEvery(LevelComponent)((levelComponent) => {
        const level = levelComponent.$entity;
        const penetration = getPenetrationDepthWithLevelBasedOnMotion(atom, level, u, viewport);
        if (penetration) {
          const resolvedPose = {
            x: nextPose.x - u.direction.x * (penetration + 0.1),
            y: nextPose.y - u.direction.y * (penetration + 0.1),
            a: nextPose.a,
          };
          const resolvedShape = Shape.transform(baseAtomShape, resolvedPose);
          viewport.drawShape({ path: resolvedShape.vertices, style: STYLE_RED });
          return;
        }
      });
    });
  }
}
