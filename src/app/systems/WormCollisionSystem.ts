import { IComponentMaster, IEntityMaster, PoseComponent, System } from '@plasmastrapi/ecs';
import {
  IPoint,
  IPose,
  IShape,
  booleanPointInPolygon,
  fromPointsToGeoJSON,
  fromShapeToGeoJSON,
  getEuclideanDistanceBetweenPoints,
  lineIntersect,
  transformShape,
} from '@plasmastrapi/geometry';
import { IVelocity, LevelComponent } from '@plasmastrapi/physics';
import { IStyle, IViewport } from '@plasmastrapi/viewport';
import Worm from 'app/entities/Worm';
import { COLOUR } from '@plasmastrapi/engine';
import Handle from 'app/entities/Handle';
import { CONSTANTS } from 'app/CONSTANTS';
import { isShallowEqual } from '@plasmastrapi/base';

const STYLE_GREEN = { colour: 'lightgreen', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_GREEN_BIG = { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 };
const STYLE_RED = { colour: 'red', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_RED_BIG = { colour: 'red', fill: 'red', opacity: 1, zIndex: 9999 };
const STYLE_YELLOW = { colour: 'yellow', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_BLUE = { colour: 'blue', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_WHITE = { colour: 'white', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_PINK = { colour: 'pink', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_ORANGE = { colour: 'orange', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };

export default class WormCollisionSystem extends System {
  public once({
    entities,
    components,
    viewport,
  }: {
    entities: IEntityMaster;
    components: IComponentMaster;
    delta: number;
    viewport: IViewport<any>;
  }): void {
    entities.forEvery(Handle)((handle) => {
      // const { x, y, a, $ } = worm.$copy(PoseComponent);
      // const prevPose = $!.previous;
      // const nextPose = { x, y, a };
      const prevPose = { x: 1280 / 2, y: 720 / 2, a: 0 };
      const nextPose = handle.$copy(PoseComponent);
      // const nextPose = { x: 250.39999389648438, y: 126.89599609375, a: 0 };
      // const nextPose = { x: 300, y: 450, a: 0 };
      // const nextPose = { x: 640, y: 200, a: 0 };
      // const nextPose = { x: 250, y: 400, a: 0 };
      // const nextPose = { x: 300, y: 500, a: 0 };
      // const nextPose = { x: 700, y: 200, a: 0 };
      // const nextPose = { x: 645, y: 365, a: 0 };
      // const nextPose = { x: 665, y: 380, a: 0 };
      // const nextPose = { x: 690, y: 500, a: 0 };
      viewport.drawLabel({
        pose: { x: 50, y: 50, a: 0 },
        style: STYLE_RED,
        label: { text: `${nextPose.x}, ${nextPose.y}`, fontSize: 10, offset: { x: 0, y: 0 } },
      });
      const testShape = {
        vertices: [
          { x: 0, y: -5 },
          { x: 10, y: -5 },
          { x: 10, y: -50 },
          { x: 50, y: -50 },
          { x: 50, y: -40 },
          { x: 20, y: -40 },
          { x: 20, y: -5 },
          { x: 200, y: -5 },
          { x: 200, y: 5 },
          { x: 20, y: 5 },
          { x: 20, y: 40 },
          { x: 50, y: 40 },
          { x: 50, y: 50 },
          { x: 10, y: 50 },
          { x: 10, y: 5 },
          { x: 0, y: 5 },
          { x: -10, y: 5 },
          { x: -10, y: 50 },
          { x: -50, y: 50 },
          { x: -50, y: 40 },
          { x: -20, y: 40 },
          { x: -20, y: 5 },
          { x: -200, y: 5 },
          { x: -200, y: -5 },
          { x: -20, y: -5 },
          { x: -20, y: -40 },
          { x: -50, y: -40 },
          { x: -50, y: -50 },
          { x: -10, y: -50 },
          { x: -10, y: -5 },
        ],
      };
      // viewport.drawShape({ path: transformShape(testShape, prevPose).vertices, style: STYLE_GREEN });
      // viewport.drawShape({ path: transformShape(testShape, nextPose).vertices, style: STYLE_BLUE });
      const hull = extrude(testShape, prevPose, nextPose, viewport);
      // const hull = convexHull(transformShape(testShape, prevPose), transformShape(testShape, nextPose));
      // viewport.drawLine({ path: hull.vertices, style: STYLE_YELLOW });
      // viewport.drawLine({ path: [prevPose, nextPose], style: STYLE_GREEN });
      components.forEvery(LevelComponent)((levelComponent) => {
        // const level = levelComponent.$entity;
        // const levelShape = fromShapeToGeoJSON(transformShape(level.$copy(ShapeComponent), level.$copy(PoseComponent)));
        // const intersection = intersect(fromShapeToGeoJSON(hull), levelShape);
        // if (intersection) {
        //   const overlap = fromGeoJSONCoordinatesToShapes(intersection)[0];
        //   // viewport.drawShape({ path: overlap.vertices, style: STYLE_GREEN });
        //   Math.min(
        //     ...overlap.vertices.map((vertex) => {
        //       // viewport.drawCircle({
        //       //   position: closestPointOnLine(prevPose, nextPose, vertex),
        //       //   radius: 2,
        //       //   style: STYLE_GREEN,
        //       // });
        //       return getEuclideanDistanceBetweenPoints(closestPointOnLine(prevPose, nextPose, vertex), prevPose);
        //     }),
        //   );
        // }
      });
    });
  }
}

function extrude(shape: IShape, from: IPose, to: IPose, viewport: IViewport<any>): IShape {
  if (to.x === from.x) {
    to.x += CONSTANTS.EPSILON;
  }
  if (to.y === from.y) {
    to.y += CONSTANTS.EPSILON;
  }
  let shapeA = transformShape(shape, from);
  let shapeB = transformShape(shape, to);
  if (to.y < from.y) {
    [shapeA, shapeB] = [shapeB, shapeA];
  }
  const gbox = GBOX.combine(GBOX.create(shapeA), GBOX.create(shapeB));
  let a = shapeA.vertices;
  let b = shapeB.vertices;
  let d = a.map((vertex, i) => [vertex, b[i]] as Edge);
  let smallestDistance = Number.POSITIVE_INFINITY;
  let idx = 0;
  for (let i = 0, L = d.length; i < L; i++) {
    const distance = getEuclideanDistanceBetweenPoints(gbox.v1, d[i][0]);
    if (distance < smallestDistance) {
      idx = i;
      smallestDistance = distance;
    }
  }
  d = rotateArray(d, idx);
  a = rotateArray(a, idx);
  b = rotateArray(b, idx);
  let edgesA = shapeToEdges({ vertices: a });
  let edgesB = shapeToEdges({ vertices: b });
  let newEdges: Edge[] = [];
  const geosA = fromShapeToGeoJSON(shapeA);
  const geosB = fromShapeToGeoJSON(shapeB);
  let startingEdge: Edge | undefined;
  for (let i = 0, L = a.length; i < L; i++) {
    const intersectionA = findIntersection(a[i], b[i], edgesA);
    const intersectionB = findIntersection(b[i], a[i], edgesB);
    if (intersectionA && !intersectionB) {
      const midPoint = [(a[i].x + intersectionA.point.x) / 2, (a[i].y + intersectionA.point.y) / 2];
      if (
        !booleanPointInPolygon(midPoint, geosA) &&
        !booleanPointInPolygon([intersectionA.point.x, intersectionA.point.y], geosB)
      ) {
        newEdges.push([a[i], intersectionA.point]);
      }
    }
    if (intersectionB && !intersectionA) {
      const midPoint = [(b[i].x + intersectionB.point.x) / 2, (b[i].y + intersectionB.point.y) / 2];
      if (
        !booleanPointInPolygon(midPoint, geosB) &&
        !booleanPointInPolygon([intersectionB.point.x, intersectionB.point.y], geosA)
      ) {
        newEdges.push([b[i], intersectionB.point]);
      }
    }
    if (!intersectionA && !intersectionB) {
      if (!booleanPointInPolygon([b[i].x, b[i].y], geosA) && !booleanPointInPolygon([a[i].x, a[i].y], geosB)) {
        if (!startingEdge || startingEdge[0].x > a[i].x) {
          startingEdge = [a[i], b[i], EDGE_TYPE.OUTER];
        }
        newEdges.push([a[i], b[i], EDGE_TYPE.OUTER]);
      }
    }
  }
  for (const edge of newEdges) {
    highlightEdge(viewport, edge, STYLE_YELLOW);
  }
  for (let i = 0; i < edgesA.length; i++) {
    const edge = edgesA[i];
    const intersectionE = findIntersection(edge[0], edge[1], newEdges);
    if (intersectionE) {
      edgesA.splice(i + 1, 0, [intersectionE.point, edge[1]]);
      edge[1] = intersectionE.point;
      i++;
    }
  }
  for (let i = 0; i < edgesA.length; i++) {
    const edge = edgesA[i];
    const intersectionB = findIntersection(edge[0], edge[1], edgesB);
    if (intersectionB) {
      edgesA.splice(i + 1, 0, [intersectionB.point, edge[1]]);
      edge[1] = intersectionB.point;
      i++;
    }
  }
  for (let i = 0; i < edgesB.length; i++) {
    const edge = edgesB[i];
    const intersectionE = findIntersection(edge[0], edge[1], newEdges);
    if (intersectionE) {
      edgesB.splice(i + 1, 0, [intersectionE.point, edge[1]]);
      edge[1] = intersectionE.point;
      i++;
    }
  }
  for (let i = 0; i < edgesB.length; i++) {
    const edge = edgesB[i];
    const intersectionA = findIntersection(edge[0], edge[1], edgesA);
    if (intersectionA) {
      edgesB.splice(i + 1, 0, [intersectionA.point, edge[1]]);
      edge[1] = intersectionA.point;
      i++;
    }
  }
  for (const edge of edgesA) {
    highlightPoint(viewport, edge[1], STYLE_GREEN);
  }
  for (const edge of edgesB) {
    highlightPoint(viewport, edge[1], STYLE_BLUE);
  }
  idx = newEdges.findIndex((edge) => isShallowEqual(edge, startingEdge!));
  newEdges = rotateArray(newEdges, idx);
  idx = findNextEdge(newEdges[0][0], edgesA);
  edgesA = rotateArray(edgesA, idx);
  edgesA.push(edgesA[0]);
  edgesB = rotateArray(edgesB, idx);
  edgesB.push(edgesB[0]);
  const extrusionEdges: Edge[] = [];
  const vertices: IPoint[] = [];
  let i = 0;
  const last = 40;
  while (edgesA.length && edgesB.length && newEdges.length && i <= last) {
    if (i === last) {
      console.log('hi');
    }
    const edge = edgesA.shift()!;
    extrusionEdges.push(edge);
    const idxE = findNewEdge(edge[1], newEdges);
    if (idxE > -1) {
      if (newEdges[idxE][2] === EDGE_TYPE.OUTER) {
        [edgesA, edgesB] = [edgesB, edgesA];
      }
      const vertex0 =
        edge[1].x === newEdges[idxE][0].x && edge[1].y === newEdges[idxE][0].y ? newEdges[idxE][0] : newEdges[idxE][1];
      const vertex1 =
        edge[1].x === newEdges[idxE][0].x && edge[1].y === newEdges[idxE][0].y ? newEdges[idxE][1] : newEdges[idxE][0];
      highlightPoint(viewport, vertex1, STYLE_RED);
      const idxA = findNextEdge(vertex1, edgesA);
      extrusionEdges.push(newEdges.splice(idxE, 1)[0]);
      let counter = idxA || 0;
      while (counter > 0) {
        edgesA.shift();
        counter--;
      }
      i++;
      continue;
    }
    const idxB = findNextEdge(edge[1], edgesB);
    if (idxB > -1) {
      let counter = idxB;
      while (counter > 0) {
        edgesB.shift();
        counter--;
      }
      [edgesA, edgesB] = [edgesB, edgesA];
    }
    i++;
  }
  // while (edgesA.length) {
  //   extrusionEdges.push(edgesA.shift()!);
  // }
  for (const edge of extrusionEdges) {
    highlightEdge(viewport, edge, STYLE_WHITE);
  }
  for (const edge of edgesA) {
    highlightEdge(viewport, edge, STYLE_GREEN);
  }
  for (const edge of edgesB) {
    highlightEdge(viewport, edge, STYLE_BLUE);
  }
  return { vertices };
}

function isVertexInEdge(vertex: IPoint, edge: Edge): boolean {
  return (vertex.x === edge[0].x && vertex.y === edge[0].y) || (vertex.x === edge[1].x && vertex.y === edge[1].y);
}

function shapeToEdges(shape: IShape): Edge[] {
  const L = shape.vertices.length;
  return shape.vertices.map((v: IPoint, i: number) => [v, shape.vertices[(i + 1) % L]]);
}

function edgeToPath(edge: Edge): IPoint[] {
  return [edge[0], edge[1]];
}

function orientation(p: IPoint, q: IPoint, r: IPoint): number {
  const a = { x: q.x - p.x, y: q.y - p.y };
  const b = { x: r.x - p.x, y: r.y - p.y };
  const val = a.x * b.y - a.y * b.x;
  if (val === 0) return 0;
  // reverse the sign because we're upside-down
  return val > 0 ? -1 : 1;
}

type Edge = [IPoint, IPoint, EDGE_TYPE?];

enum EDGE_TYPE {
  OUTER,
  NEW,
}

interface IGBOX {
  v1: IPoint;
  v2: IPoint;
  v3: IPoint;
  v4: IPoint;
}

abstract class GBOX {
  private constructor() {}

  public static create(shape: IShape, epsilon = 0): IGBOX {
    const vertices = shape.vertices;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0, L = vertices.length; i < L; i++) {
      const vertex = vertices[i];
      if (vertex.x < minX) {
        minX = vertex.x;
      }
      if (vertex.y < minY) {
        minY = vertex.y;
      }
      if (vertex.x > maxX) {
        maxX = vertex.x;
      }
      if (vertex.y > maxY) {
        maxY = vertex.y;
      }
    }
    return {
      v1: { x: minX - epsilon, y: minY - epsilon },
      v2: { x: maxX + epsilon, y: minY - epsilon },
      v3: { x: maxX + epsilon, y: maxY + epsilon },
      v4: { x: minX - epsilon, y: maxY + epsilon },
    };
  }
  public static combine(g1: IGBOX, g2: IGBOX): IGBOX {
    const minX = Math.min(g1.v1.x, g2.v1.x);
    const minY = Math.min(g1.v1.y, g2.v1.y);
    const maxX = Math.max(g1.v3.x, g2.v3.x);
    const maxY = Math.max(g1.v3.y, g2.v3.y);
    return {
      v1: { x: minX, y: minY },
      v2: { x: maxX, y: minY },
      v3: { x: maxX, y: maxY },
      v4: { x: minX, y: maxY },
    };
  }
}

function rotateArray<T>(source: T[], n: number): T[] {
  const len = source.length;
  n = ((n % len) + len) % len;
  return source.slice(n).concat(source.slice(0, n));
}

function highlightEdge(viewport: IViewport<any> | undefined, edge: Edge, style: IStyle): void {
  viewport?.drawLine({ path: edgeToPath(edge), style });
}

function highlightPoint(viewport: IViewport<any> | undefined, position: IPoint, style: IStyle): void {
  viewport?.drawCircle({ position, radius: 2, style });
}

interface IIntersection {
  point: IPoint;
  index: number;
  distance: number;
}

interface IFindIntersectionOptions {
  isIncludeStart: boolean;
  isIncludeEnd: boolean;
}

function findIntersection(
  start: IPoint,
  end: IPoint,
  edges: Edge[],
  options?: IFindIntersectionOptions,
): IIntersection | undefined {
  options = options || { isIncludeStart: false, isIncludeEnd: false };
  const intersections: [IPoint, number][] = edges
    .map((edge, idx) => {
      return [lineIntersect(fromPointsToGeoJSON([start, end]), fromPointsToGeoJSON([edge[0], edge[1]])), idx];
    })
    .filter(([intersection]) => {
      let isValidIntersection = intersection.features.length > 0;
      if (isValidIntersection) {
        const [x, y] = intersection.features[0].geometry.coordinates;
        if (options && options.isIncludeStart === false) {
          isValidIntersection = isValidIntersection && !(start.x === x && start.y === y);
        }
        if (options && options.isIncludeEnd === false) {
          isValidIntersection = isValidIntersection && !(end.x === x && end.y === y);
        }
      }
      return isValidIntersection;
    })
    .map(([intersection, idx]) => {
      const [x, y] = intersection.features[0].geometry.coordinates;
      return [{ x, y }, idx];
    });
  intersections.sort(([{ x: x1, y: y1 }], [{ x: x2, y: y2 }]) => {
    return (
      getEuclideanDistanceBetweenPoints(start, { x: x1, y: y1 }) - getEuclideanDistanceBetweenPoints(start, { x: x2, y: y2 })
    );
  });
  return intersections.length
    ? {
        point: intersections[0][0],
        index: intersections[0][1],
        distance: getEuclideanDistanceBetweenPoints(start, intersections[0][0]),
      }
    : undefined;
}

function findNewEdge(point: IPoint, edges: Edge[]): number {
  return edges.findIndex((edge) => {
    return (point.x === edge[0].x && point.y === edge[0].y) || (point.x === edge[1].x && point.y === edge[1].y);
  });
}

function findNextEdge(start: IPoint, edges: Edge[]): number {
  return edges.findIndex((edge) => {
    return Math.abs(start.x - edge[0].x) < CONSTANTS.EPSILON && Math.abs(start.y - edge[0].y) < CONSTANTS.EPSILON;
  });
}
