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
} from '@plasmastrapi/geometry';
import { CONSTANTS } from './CONSTANTS';
import { IEntity } from '@plasmastrapi/ecs';
import { Epsilon } from '@plasmastrapi/math';
import { COLOUR, IStyle, IViewport } from '@plasmastrapi/viewport';

const STYLE_GREEN = { colour: 'lightgreen', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_GREEN_BIG = { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 };
const STYLE_RED = { colour: 'red', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_RED_BIG = { colour: 'red', fill: 'red', opacity: 1, zIndex: 9999 };
const STYLE_YELLOW = { colour: 'yellow', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_BLUE = { colour: 'blue', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_WHITE = { colour: 'white', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_PINK = { colour: 'pink', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_ORANGE = { colour: 'orange', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };

export function getVerticalLineIntersectionsWithLevel(origin: IPoint, level: IEntity): IEdgesIntersection[] | undefined {
  const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
  const levelEdges = Shape.toEdges(levelShape);
  const intersections = levelEdges
    .filter((edge) => {
      return isWithin(origin.x, edge[0].x, edge[1].x);
    })
    .map((edge) => {
      const start = origin;
      const end = { x: origin.x, y: edge[0].y < edge[1].y ? edge[0].y : edge[1].y };
      return Shape.findEdgeIntersection(start, end, [edge], { isIncludeStart: true, isIncludeEnd: true });
    })
    .filter((intersection) => !!intersection);
  if (intersections.length === 0) {
    return undefined;
  }
  return intersections as IEdgesIntersection[];
}

export function getPenetrationDepthWithLevelBasedOnMotion(
  target: IEntity,
  level: IEntity,
  v?: INormalizedVector,
  viewport?: IViewport,
): number | undefined {
  const { x, y, a, $ } = target.$copy(PoseComponent);
  const prevPose = v ? { x: x - v.direction.x * v.magnitude, y: y - v.direction.y * v.magnitude, a } : $!.previous;
  const nextPose = { x, y, a };
  const baseTargetShape = target.$copy(ShapeComponent);
  const nextShape = Shape.transform(baseTargetShape, nextPose);
  const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
  const levelEdges = Shape.toEdges(levelShape);
  const geoJsonTarget = GeoJSON.createFromShape(nextShape);
  const geoJsonLevel = GeoJSON.createFromShape(levelShape);
  if (!booleanContains(geoJsonLevel, geoJsonTarget) && !booleanOverlap(geoJsonLevel, geoJsonTarget)) {
    return undefined;
  }
  const originPose = Epsilon.isRoughlyEqual(prevPose, nextPose, CONSTANTS.EPSILON)
    ? { x: nextPose.x - 0, y: nextPose.y - 1, a: nextPose.a }
    : prevPose;
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
  const intersections1 = rotatedTargetEdges.map((edge) => {
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
  const intersections2 = validLevelEdges.map((edge) => {
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
  const penetrations = [...intersections1.flat(), ...intersections2.flat()]
    .filter((intersection) => !!intersection)
    .map((intersection) => {
      const resolvedPose = {
        x: nextPose.x - u.direction.x * (intersection!.distance + 0.1),
        y: nextPose.y - u.direction.y * (intersection!.distance + 0.1),
        a: nextPose.a,
      };
      const resolvedShape = Shape.transform(baseTargetShape, resolvedPose);
      const resolvedGeoJson = GeoJSON.createFromShape(resolvedShape);
      const isBooleanOverlap = booleanOverlap(resolvedGeoJson, geoJsonLevel);
      const isBooleanContains = booleanContains(geoJsonLevel, resolvedGeoJson);
      if (isBooleanOverlap || isBooleanContains) {
        return undefined;
      }
      return intersection;
    })
    .filter((intersection) => !!intersection)
    .flat();
  const originShape = Shape.transform(baseTargetShape, originPose);
  const geoJsonOrigin = GeoJSON.createFromShape(originShape);
  const isOriginShapeContainedOrOverlapping =
    booleanContains(geoJsonLevel, geoJsonOrigin) || booleanOverlap(geoJsonLevel, geoJsonOrigin);
  if (!isOriginShapeContainedOrOverlapping) {
    const penetration = penetrations.find((intersection) => {
      const resolvedPose = {
        x: nextPose.x - u.direction.x * (intersection!.distance + 0.1),
        y: nextPose.y - u.direction.y * (intersection!.distance + 0.1),
        a: nextPose.a,
      };
      const resolvedShape = Shape.transform(baseTargetShape, resolvedPose);
      for (let i = 0, L = baseTargetShape.vertices.length; i < L; i++) {
        const start = originShape.vertices[i];
        const end = resolvedShape.vertices[i];
        if (Shape.findEdgeIntersection(start, end, levelEdges, { isIncludeStart: true, isIncludeEnd: true })) {
          return false;
        }
      }
      return true;
    })?.distance;
    if (penetration) {
      return penetration;
    }
  }
  const nearestPenetration = penetrations
    .filter((result) => result!.distance >= u.magnitude)
    .reduce(
      (prev, curr) => {
        return curr!.distance < prev.distance ? curr : prev;
      },
      { distance: Infinity },
    )?.distance;
  if (nearestPenetration === Infinity) {
    const furthestPenetration = penetrations.reduce(
      (prev, curr) => {
        return curr!.distance > prev.distance ? curr : prev;
      },
      { distance: 0 },
    )?.distance;
    if (furthestPenetration === 0) {
      throw new Error('Indeterminate collision!');
    }
    return furthestPenetration;
  }
  return nearestPenetration;
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

export function highlightEdge(viewport: IViewport | undefined, edge: Edge, style: IStyle): void {
  viewport?.drawLine({ path: [edge[0], edge[1]], style });
}

export function highlightPoint(viewport: IViewport | undefined, position: IPoint, style: IStyle): void {
  viewport?.drawCircle({ position, radius: 3, style });
}

export function highlightShape(viewport: IViewport | undefined, shape: IShape, style: IStyle): void {
  viewport?.drawShape({ path: shape.vertices, style });
}
