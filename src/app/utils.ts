import {
  IPoint,
  IShape,
  GeoJSON,
  Vector,
  Edge,
  INormalizedVector,
  Shape,
  PoseComponent,
  ShapeComponent,
  Point,
  booleanContains,
  booleanOverlap,
  IEdgesIntersection,
  IPose,
} from '@plasmastrapi/geometry';
import { CONSTANTS } from './CONSTANTS';
import { IEntity } from '@plasmastrapi/ecs';
import { Epsilon } from '@plasmastrapi/math';
import { COLOUR, IStyle, IViewport } from '@plasmastrapi/viewport';
import { LevelComponent } from '@plasmastrapi/common';

export const STYLE_GREEN = { colour: 'lightgreen', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
export const STYLE_GREEN_BIG = { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 };
export const STYLE_RED = { colour: 'red', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
export const STYLE_RED_BIG = { colour: 'red', fill: 'red', opacity: 1, zIndex: 9999 };
export const STYLE_YELLOW = { colour: 'yellow', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
export const STYLE_BLUE = { colour: 'blue', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
export const STYLE_WHITE = { colour: 'white', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
export const STYLE_PINK = { colour: 'pink', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
export const STYLE_ORANGE = { colour: 'orange', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };

export function getLevelEdges(levelComponent: LevelComponent): Edge[] {
  const level = levelComponent.$entity;
  const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
  const levelEdges = Shape.toEdges(levelShape);
  return levelEdges;
}

export function getHighestIntersectionWithinWormRangeOfMotion(
  bottomOfWorm: { x: number; y: number },
  intersections: IEdgesIntersection[],
): IEdgesIntersection | undefined {
  const intersection = intersections
    .filter((intersection) => {
      return Math.abs(intersection.point.y - bottomOfWorm.y) <= CONSTANTS.WORM.MAX_VERTICAL_STEP_HEIGHT;
    })
    .reduce(
      (prev, curr) => {
        return curr.point.y < prev.point.y ? curr : prev;
      },
      { point: { x: 0, y: Infinity } },
    );
  return intersection.point.y === Infinity ? undefined : (intersection as IEdgesIntersection);
}

export function getVerticalLineIntersectionsWithLevel(origin: IPoint, levelEdges: Edge[]): IEdgesIntersection[] {
  return levelEdges
    .filter((edge) => {
      return isWithin(origin.x, edge[0].x, edge[1].x);
    })
    .map((edge) => {
      const start = origin;
      let end;
      if (isPointBelowEdge(origin, edge)) {
        end = { x: origin.x, y: edge[0].y < edge[1].y ? edge[0].y : edge[1].y };
      } else if (isPointAboveEdge(origin, edge)) {
        end = { x: origin.x, y: edge[0].y > edge[1].y ? edge[0].y : edge[1].y };
      } else {
        return { point: origin, distance: 0 };
      }
      return Shape.findEdgeIntersection(start, end, [edge], { isIncludeStart: true, isIncludeEnd: true });
    })
    .filter((intersection) => !!intersection) as IEdgesIntersection[];
}

export function getClosestIntersectionWithLevelBasedOnDifferentStartAndEndShapes(
  curPose: IPose,
  curBaseShape: IShape,
  nextPose: IPose,
  nextBaseShape: IShape,
  level: IEntity,
  viewport?: IViewport,
): IEdgesIntersection | undefined {
  const nextShape = Shape.transform(nextBaseShape, nextPose);
  const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
  const levelEdges = Shape.toEdges(levelShape);
  const geoJsonLevel = GeoJSON.createFromShape(levelShape);
  const originPose = Epsilon.isRoughlyEqual(curPose as any, nextPose, CONSTANTS.EPSILON)
    ? // default to a pose that will yield an upward direction vector
      { x: nextPose.x, y: nextPose.y - 0.1, a: nextPose.a }
    : curPose;
  const u = Vector.normalizeFromPoints(originPose, nextPose);
  const rotationAngle = Math.PI / 2 - Point.getAngleBetweenPoints(originPose, nextPose);
  const rotatedTargetVertices = nextShape.vertices.map((vertex) => rotatePoint(nextPose, vertex, rotationAngle));
  const rotatedTargetEdges = Shape.toEdges({ vertices: rotatedTargetVertices });
  const rotatedLevelVertices = levelShape.vertices.map((vertex) => rotatePoint(nextPose, vertex, rotationAngle));
  const rotatedLevelEdges = Shape.toEdges({ vertices: rotatedLevelVertices });
  const validLevelEdges = rotatedLevelEdges.filter((levelEdge) => {
    return (
      rotatedTargetVertices.find((vertex) => {
        return isWithin(vertex.x, levelEdge[0].x, levelEdge[1].x) && isPointBelowEdge(vertex, levelEdge);
      }) ||
      rotatedTargetEdges.find((targetEdge) => {
        return Shape.findEdgeIntersection(targetEdge[0], targetEdge[1], [levelEdge], {
          isIncludeStart: true,
          isIncludeEnd: true,
        });
      })
    );
  });
  const validLevelVertices = validLevelEdges.flatMap((edge) => edge) as IPoint[];
  const intersectionsFromLevelVerticesToTargetEdges = rotatedTargetEdges.map((edge) => {
    return validLevelVertices.map((vertex) => {
      const start = vertex;
      if (!(isWithin(start.x, edge[0].x, edge[1].x) && isPointAboveEdge(start, edge))) {
        return undefined;
      }
      const bottomVertex = edge[0].y > edge[1].y ? edge[0] : edge[1];
      const end = { x: start.x, y: bottomVertex.y };
      return Shape.findEdgeIntersection(start, end, [edge], { isIncludeStart: true, isIncludeEnd: true });
    });
  });
  const intersectionsFromTargetVerticesToLevelEdges = validLevelEdges.map((edge) => {
    return rotatedTargetVertices.map((vertex) => {
      const start = vertex;
      if (!(isWithin(start.x, edge[0].x, edge[1].x) && isPointBelowEdge(start, edge))) {
        return undefined;
      }
      const topVertex = edge[0].y < edge[1].y ? edge[0] : edge[1];
      const end = { x: start.x, y: topVertex.y };
      return Shape.findEdgeIntersection(start, end, [edge], { isIncludeStart: true, isIncludeEnd: true });
    });
  });
  const intersections = [
    ...intersectionsFromLevelVerticesToTargetEdges.flat(),
    ...intersectionsFromTargetVerticesToLevelEdges.flat(),
  ]
    .filter((intersection) => !!intersection)
    .map((intersection) => {
      const resolvedPose = {
        x: nextPose.x - u.direction.x * (intersection!.distance + 0.1),
        y: nextPose.y - u.direction.y * (intersection!.distance + 0.1),
        a: nextPose.a,
      };
      const resolvedShape = Shape.transform(nextBaseShape, resolvedPose);
      const resolvedGeoJson = GeoJSON.createFromShape(resolvedShape);
      if (
        booleanOverlap(resolvedGeoJson, geoJsonLevel) ||
        booleanContains(geoJsonLevel, resolvedGeoJson) ||
        booleanContains(resolvedGeoJson, geoJsonLevel)
      ) {
        return undefined;
      }
      return intersection;
    })
    .filter((intersection) => !!intersection);
  const originShape = Shape.transform(curBaseShape, originPose);
  const geoJsonOrigin = GeoJSON.createFromShape(originShape);
  const isOriginShapeContainedOrOverlapping =
    booleanContains(geoJsonLevel, geoJsonOrigin) || booleanOverlap(geoJsonLevel, geoJsonOrigin);
  if (!isOriginShapeContainedOrOverlapping) {
    const intersection = intersections.find((intersection) => {
      const resolvedPose = {
        x: nextPose.x - u.direction.x * (intersection!.distance + 0.1),
        y: nextPose.y - u.direction.y * (intersection!.distance + 0.1),
        a: nextPose.a,
      };
      const resolvedShape = Shape.transform(nextBaseShape, resolvedPose);
      for (let i = 0, L = nextBaseShape.vertices.length; i < L; i++) {
        const start = originShape.vertices[i];
        const end = resolvedShape.vertices[i];
        if (Shape.findEdgeIntersection(start, end, levelEdges, { isIncludeStart: true, isIncludeEnd: true })) {
          return false;
        }
      }
      return true;
    });
    if (intersection) {
      intersection.point = rotatePoint(nextPose, intersection.point, -rotationAngle);
    }
    return intersection;
  }
  const nearestIntersection = intersections
    .filter((intersection) => intersection!.distance >= u.magnitude)
    .reduce(
      (prev, curr) => {
        return curr!.distance < prev.distance ? curr : prev;
      },
      { distance: Infinity, point: { x: Infinity, y: Infinity } },
    );
  if (nearestIntersection!.distance === Infinity) {
    const furthestIntersection = intersections.reduce(
      (prev, curr) => {
        return curr!.distance > prev?.distance ? curr : prev;
      },
      { distance: 0, point: { x: 0, y: 0 } },
    );
    if (furthestIntersection!.distance === 0) {
      throw new Error('Indeterminate collision!');
    }
    furthestIntersection!.point = rotatePoint(nextPose, furthestIntersection!.point, -rotationAngle);
    return furthestIntersection as IEdgesIntersection;
  }
  nearestIntersection!.point = rotatePoint(nextPose, nearestIntersection!.point, -rotationAngle);
  return nearestIntersection as IEdgesIntersection;
}

export function getPenetrationDepthWithLevelBasedOnDifferentStartAndEndShapes(
  curPose: IPose,
  curBaseShape: IShape,
  nextPose: IPose,
  nextBaseShape: IShape,
  level: IEntity,
  viewport?: IViewport,
): number | undefined {
  return getClosestIntersectionWithLevelBasedOnDifferentStartAndEndShapes(
    curPose,
    curBaseShape,
    nextPose,
    nextBaseShape,
    level,
    viewport,
  )?.distance;
}

export function getPenetrationDepthWithLevelBasedOnNextPose(
  curPose: IPose,
  nextPose: IPose,
  baseShape: IShape,
  level: IEntity,
  viewport?: IViewport,
): number | undefined {
  return getPenetrationDepthWithLevelBasedOnDifferentStartAndEndShapes(curPose, baseShape, nextPose, baseShape, level, viewport);
}

export function getPenetrationDepthWithLevelBasedOnMotion(
  target: IEntity,
  level: IEntity,
  v?: INormalizedVector,
  viewport?: IViewport,
): number | undefined {
  const { x, y, a, $ } = target.$copy(PoseComponent);
  const curPose = { x, y, a };
  const baseTargetShape = target.$copy(ShapeComponent);
  const prevPose = v ? { x: x - v.direction.x * v.magnitude, y: y - v.direction.y * v.magnitude, a } : $!.previous;
  return getPenetrationDepthWithLevelBasedOnNextPose(prevPose, curPose, baseTargetShape, level, viewport);
}

function rotatePoint(origin: IPoint, target: IPoint, rotationAngle: number): IPoint {
  const xOffset = target.x - origin.x;
  const yOffset = target.y - origin.y;
  return {
    x: origin.x + xOffset * Math.cos(rotationAngle) - yOffset * Math.sin(rotationAngle),
    y: origin.y + xOffset * Math.sin(rotationAngle) + yOffset * Math.cos(rotationAngle),
  };
}

function isWithin(target: number, a: number, b: number): boolean {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return target >= min && target <= max;
}

function isPointBelowEdge(point: IPoint, edge: Edge): boolean {
  const { x, y } = point;
  const { x: x1, y: y1 } = edge[0];
  const { x: x2, y: y2 } = edge[1];
  const lineY = ((y2 - y1) / (x2 - x1)) * (x - x1) + y1;
  return y > lineY;
}

function isPointAboveEdge(point: IPoint, edge: Edge): boolean {
  const { x, y } = point;
  const { x: x1, y: y1 } = edge[0];
  const { x: x2, y: y2 } = edge[1];
  const lineY = ((y2 - y1) / (x2 - x1)) * (x - x1) + y1;
  return y < lineY;
}

export function radToDeg(rads: number): number {
  return (rads * 180) / Math.PI;
}

export function degToRad(degs: number): number {
  return (degs * Math.PI) / 180;
}

export function highlightEdge(viewport: IViewport | undefined, edge: Edge, style: IStyle): void {
  viewport?.drawLine({ path: [edge[0], edge[1]], style });
}

export function highlightPoint(viewport: IViewport | undefined, position: IPoint, style: IStyle): void {
  viewport?.drawCircle({ position, radius: 3, style });
}

export function highlightShape(viewport: IViewport | undefined, shape: IShape, style: IStyle): void {
  viewport?.drawShape({ path: shape.vertices, style });
}
