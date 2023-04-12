import { IComponentMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
import { fromPointsToGeoJSON, fromShapeToGeoJSON, transformShape } from '@plasmastrapi/geometry';
import { VelocityComponent } from '@plasmastrapi/physics';
import { IImage } from '@plasmastrapi/viewport';
import AnimationComponent from 'app/components/AnimationComponent';
import LevelComponent from 'app/components/LevelComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import Worm from 'app/entities/Worm';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { WORM_HEADING } from 'app/enums/WORM_HEADING';
const lineIntersect = require('@turf/line-intersect').default;

export default class WormStateSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(WormStateComponent)((wsComponent) => {
      const worm = wsComponent.$entity as Worm;
      const { heading, facing, action, stored, $ } = wsComponent.copy();
      const f = facing === WORM_FACING.RIGHT ? 1 : -1;
      const fSuffix = facing === WORM_FACING.RIGHT ? 'R' : 'L';
      const hSuffix = getWormHeading(worm, components);
      if (heading === hSuffix && facing === $?.previous?.facing && action === $.previous?.action) {
        if (action === WORM_ACTION.JUMP) {
          if ($.tNextAction! <= Date.now()) {
            worm.$patch(VelocityComponent, { x: f * 150, y: -150, w: 0 });
            worm.$patch(WormStateComponent, { action: WORM_ACTION.AIR });
          }
          return;
        }
        const velocity = worm.$copy(VelocityComponent)!;
        if (action === WORM_ACTION.AIR && velocity.x === 0 && velocity.y === 0 && velocity.w === 0) {
          worm.$patch(WormStateComponent, { action: WORM_ACTION.IDLE });
          return;
        }
        return;
      }
      worm.$patch(WormStateComponent, { heading: hSuffix, facing, action, $: { previous: { facing, action } } });
      if (action === WORM_ACTION.IDLE) {
        if (stored) {
          worm.$patch(WormStateComponent, { facing: stored.facing, action: stored.action });
          return;
        }
        worm.$patch(VelocityComponent, { x: 0, y: 0, w: 0 });
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wbrth1${fSuffix}${hSuffix}.png`, 60, 60, 1200),
          frame: 0,
          isRollback: true,
          durationMs: 30,
        });
        return;
      }
      if (action === WORM_ACTION.WALK) {
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wwalk${fSuffix}${hSuffix}.png`, 60, 60, 900, f * 0.667),
          frame: 0,
          durationMs: 30,
        });
        return;
      }
      if (action == WORM_ACTION.JUMP) {
        worm.$patch(WormStateComponent, { $: { tNextAction: Date.now() + 200 } });
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wjump${fSuffix}.png`, 60, 60, 600),
          frame: 0,
          durationMs: 20,
        });
        return;
      }
      if (action == WORM_ACTION.AIR) {
        worm.$add(AnimationComponent, {
          images: buildFrames(`./assets/wwalk${fSuffix}.png`, 60, 60, 60),
          frame: 0,
          durationMs: 10,
        });
        return;
      }
    });
  }
}

export function getWormHeading(worm: Worm, components: IComponentMaster): WORM_HEADING {
  let heading = WORM_HEADING.STRAIGHT;
  const pose = worm.$copy(PoseComponent)!;
  const { facing } = worm.$copy(WormStateComponent)!;
  const f = facing === WORM_FACING.RIGHT ? 1 : -1;
  // throw a vertical line behind us, find the first intersection if one exists, then set heading away from that point
  const throwDistance = 5;
  const steepnessThreshold = 100;
  const verticalLine = fromPointsToGeoJSON([
    { x: pose.x - f * throwDistance, y: pose.y - steepnessThreshold },
    { x: pose.x - f * throwDistance, y: pose.y + steepnessThreshold },
  ]);
  let isLevelIntersection = false;
  components.forEvery(LevelComponent)((levelComponent) => {
    if (isLevelIntersection) {
      return;
    }
    const level = levelComponent.$entity;
    const levelPose = level.$copy(PoseComponent)!;
    const levelShape = level.$copy(ShapeComponent)!;
    const levelGeoJSON = fromShapeToGeoJSON(transformShape(levelShape, levelPose));
    const intersections = lineIntersect(levelGeoJSON, verticalLine);
    if (intersections.features.length > 0) {
      const y = intersections.features.shift().geometry.coordinates[1];
      const diffY = pose.y - y;
      if (diffY > 1.5) {
        heading = WORM_HEADING.DOWN;
      } else if (diffY < -1) {
        heading = WORM_HEADING.UP;
      }
      isLevelIntersection = true;
      return;
    }
  });
  return heading;
}

function buildFrames(src: string, frameWidth: number, frameHeight: number, imageHeight: number, offsetCreep = 0): IImage[] {
  const images: IImage[] = [];
  for (let i = 0, L = imageHeight; i < L; i += frameHeight) {
    images.push({
      src,
      crop: { sourceX: 0, sourceY: i, sourceWidth: frameWidth, sourceHeight: frameHeight },
      offset: { x: -30 - (offsetCreep * i) / frameHeight, y: -42 },
      width: frameWidth,
      height: frameHeight,
      zIndex: 0,
    });
  }
  return images;
}
