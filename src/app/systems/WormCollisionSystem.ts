import { IComponentMaster, IEntityMaster, PoseComponent, ShapeComponent, System } from '@plasmastrapi/ecs';
import {
  IPoint,
  IPose,
  IShape,
  booleanPointInPolygon,
  fromGeoJSONCoordinatesToShapes,
  fromPointsToGeoJSON,
  fromShapeToGeoJSON,
  getEuclideanDistanceBetweenPoints,
  intersect,
  lineIntersect,
  transformShape,
} from '@plasmastrapi/geometry';
import { IVelocity, LevelComponent } from '@plasmastrapi/physics';
import { IStyle, IViewport } from '@plasmastrapi/viewport';
import Worm from 'app/entities/Worm';
import { COLOUR } from '@plasmastrapi/engine';
import { CONSTANTS } from 'app/CONSTANTS';
import { clone, isShallowEqual } from '@plasmastrapi/base';
import Handle from 'app/entities/Handle';

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
      // const extrusion = extrude(worm.$copy(ShapeComponent), prevPose, nextPose);
      // const extrusion = extrude(worm.$copy(ShapeComponent), prevPose, nextPose);
      const prevPose = { x: 400, y: 200, a: 0 };
      const nextPose = handle.$copy(PoseComponent);
      // const nextPose = { x: 380, y: 190, a: 0 };
      // const nextPose = { x: 48, y: 400, a: 0 };
      // const nextPose = { x: 600, y: 400, a: 0 };
      // const nextPose = { x: 300, y: 400, a: 0 };
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
      const extrusion = extrude(testShape, prevPose, nextPose, viewport);
      components.forEvery(LevelComponent)((levelComponent) => {
        // const level = levelComponent.$entity;
        // const levelShape = fromShapeToGeoJSON(transformShape(level.$copy(ShapeComponent), level.$copy(PoseComponent)));
        // const intersection = intersect(fromShapeToGeoJSON(extrusion), levelShape);
        // if (intersection) {
        //   const overlap = fromGeoJSONCoordinatesToShapes(intersection)[0];
        //   viewport.drawShape({ path: overlap.vertices, style: STYLE_GREEN });
        //   const minTranslationVector = separateShapes(
        //     extrusion,
        //     transformShape(level.$copy(ShapeComponent), level.$copy(PoseComponent)),
        //     { x: -1, y: -1 },
        //   )!;
        //   highlightEdge(
        //     viewport,
        //     [nextPose, { x: nextPose.x + minTranslationVector?.x, y: nextPose.y + minTranslationVector?.y }],
        //     STYLE_RED,
        //   );
        // }
      });
    });
  }
}

function extrude(shape: IShape, from: IPose, to: IPose, viewport?: IViewport<any>): IShape {
  if (to.x === from.x) {
    to.x += 0.5;
  }
  if (to.y === from.y) {
    to.y += 0.5;
  }
  if (to.y < from.y) {
    [from, to] = [to, from];
  }
  const shapeA = transformShape(shape, from);
  const shapeB = transformShape(shape, to);
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
    const intersectionA = findIntersection(a[i], b[i], edgesA, { isIncludeEnd: true });
    const intersectionB = findIntersection(b[i], a[i], edgesB, { isIncludeEnd: true });
    if (intersectionA && intersectionB) {
      console.log('hello');
    }
    if (intersectionA && !intersectionB) {
      const midPoint = [(a[i].x + intersectionA.point.x) / 2, (a[i].y + intersectionA.point.y) / 2];
      if (
        !booleanPointInPolygon(midPoint, geosA) &&
        !booleanPointInPolygon([intersectionA.point.x, intersectionA.point.y], geosB, { ignoreBoundary: true })
      ) {
        newEdges.push([a[i], intersectionA.point]);
      }
    }
    if (intersectionB && !intersectionA) {
      const midPoint = [(b[i].x + intersectionB.point.x) / 2, (b[i].y + intersectionB.point.y) / 2];
      if (
        !booleanPointInPolygon(midPoint, geosB) &&
        !booleanPointInPolygon([intersectionB.point.x, intersectionB.point.y], geosA, { ignoreBoundary: true })
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
  for (const edge of edgesA) {
    highlightEdge(viewport, edge, STYLE_GREEN);
  }
  for (const edge of edgesB) {
    highlightEdge(viewport, edge, STYLE_BLUE);
  }
  const newEdgesA: Edge[] = [];
  for (let i = 0; i < edgesA.length; i++) {
    const edge = clone(edgesA[i]);
    newEdgesA.push(edge);
    const intersectionsB = findAllIntersections(edge[0], edge[1], edgesB);
    const end = clone(edge[1]);
    while (intersectionsB.length) {
      const intersectionB = intersectionsB.shift()!;
      newEdgesA.push([intersectionB.point, end]);
      newEdgesA[newEdgesA.length - 2][1] = intersectionB.point;
    }
  }
  const newEdgesB: Edge[] = [];
  for (let i = 0; i < edgesB.length; i++) {
    const edge = clone(edgesB[i]);
    newEdgesB.push(edge);
    const intersectionsA = findAllIntersections(edge[0], edge[1], edgesA);
    const end = clone(edge[1]);
    while (intersectionsA.length) {
      const intersectionA = intersectionsA.shift()!;
      if (!isShallowEqual(intersectionA.point, { x: edge[1].x, y: edge[1].y })) {
        newEdgesB.push([intersectionA.point, end]);
        newEdgesB[newEdgesB.length - 2][1] = intersectionA.point;
      }
    }
  }
  for (let i = 0; i < newEdgesA.length; i++) {
    const edge = newEdgesA[i];
    const intersectionE = findIntersection(edge[0], edge[1], newEdges, { isIncludeEnd: true });
    if (intersectionE) {
      if (!isShallowEqual(intersectionE.point, clone(edge[1]))) {
        newEdgesA.splice(i + 1, 0, [intersectionE.point, clone(edge[1])]);
        edge[1] = intersectionE.point;
        i++;
      }
    }
  }
  for (let i = 0; i < newEdgesB.length; i++) {
    const edge = newEdgesB[i];
    const intersectionE = findIntersection(edge[0], edge[1], newEdges, { isIncludeEnd: true });
    if (intersectionE) {
      if (!isShallowEqual(intersectionE.point, clone(edge[1]))) {
        newEdgesB.splice(i + 1, 0, [intersectionE.point, clone(edge[1])]);
        edge[1] = intersectionE.point;
        i++;
      }
    }
  }
  edgesA = newEdgesA;
  edgesB = newEdgesB;
  idx = newEdges.findIndex((edge) => isShallowEqual(edge, startingEdge!));
  newEdges = rotateArray(newEdges, idx);
  idx = findNextEdge(newEdges[0][0], edgesA);
  edgesA = rotateArray(edgesA, idx);
  idx = findNextEdge(newEdges[0][1], edgesB);
  edgesB = rotateArray(edgesB, idx);
  const extrusionEdges: Edge[] = [];
  let i = 0;
  const last = Number.POSITIVE_INFINITY;
  while (edgesA.length && edgesB.length && newEdges.length && i <= last) {
    const edge = edgesA.shift()!;
    extrusionEdges.push(edge);
    const idxE = findEdgeWithVertex(edge[1], newEdges);
    if (idxE > -1) {
      if (newEdges[idxE][2] === EDGE_TYPE.OUTER) {
        [edgesA, edgesB] = [edgesB, edgesA];
      }
      // const vertex0 =
      //   edge[1].x === newEdges[idxE][0].x && edge[1].y === newEdges[idxE][0].y ? newEdges[idxE][0] : newEdges[idxE][1];
      const vertex1 =
        edge[1].x === newEdges[idxE][0].x && edge[1].y === newEdges[idxE][0].y ? newEdges[idxE][1] : newEdges[idxE][0];
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
  for (const edge of extrusionEdges) {
    highlightEdge(viewport, edge, STYLE_WHITE);
  }
  // for (const edge of edgesA) {
  //   highlightEdge(viewport, edge, STYLE_GREEN);
  // }
  // for (const edge of edgesB) {
  //   highlightEdge(viewport, edge, STYLE_BLUE);
  // }
  return {
    vertices: extrusionEdges
      .map((edge) => edge[0])
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      })
      .slice(0, extrusionEdges.length - 2),
  };
}

function orientation(p: IPoint, q: IPoint, r: IPoint): number {
  const a = { x: q.x - p.x, y: q.y - p.y };
  const b = { x: r.x - p.x, y: r.y - p.y };
  const val = a.x * b.y - a.y * b.x;
  if (val === 0) return 0;
  // reverse the sign because we're upside-down
  return val > 0 ? -1 : 1;
}

function shapeToEdges(shape: IShape): Edge[] {
  const L = shape.vertices.length;
  return shape.vertices.map((v: IPoint, i: number) => [v, shape.vertices[(i + 1) % L]]);
}

function edgeToPath(edge: Edge): IPoint[] {
  return [edge[0], edge[1]];
}

type Edge = [IPoint, IPoint, EDGE_TYPE?];

enum EDGE_TYPE {
  OUTER,
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
  epsilon?: number;
  isIncludeStart?: boolean;
  isIncludeEnd?: boolean;
}

function findIntersection(
  start: IPoint,
  end: IPoint,
  edges: Edge[],
  options: IFindIntersectionOptions = { epsilon: 0.000001, isIncludeStart: false, isIncludeEnd: false },
): IIntersection | undefined {
  const intersections = findAllIntersections(start, end, edges, options);
  return intersections.length ? intersections[0] : undefined;
}

function findAllIntersections(
  start: IPoint,
  end: IPoint,
  edges: Edge[],
  options: IFindIntersectionOptions = { epsilon: 0.000001, isIncludeStart: false, isIncludeEnd: false },
): IIntersection[] {
  options = Object.assign({ epsilon: 0.000001, isIncludeStart: false, isIncludeEnd: false }, options);
  return edges
    .map((edge, idx) => {
      const from = edge[0];
      const to = edge[1];
      if (Math.abs(start.x - edge[0].x) <= options.epsilon!) {
        from.x = start.x;
      }
      if (Math.abs(start.y - edge[0].y) <= options.epsilon!) {
        from.y = start.y;
      }
      if (Math.abs(end.x - edge[0].x) <= options.epsilon!) {
        from.x = end.x;
      }
      if (Math.abs(end.y - edge[0].y) <= options.epsilon!) {
        from.y = end.y;
      }
      if (Math.abs(start.x - edge[1].x) <= options.epsilon!) {
        to.x = start.x;
      }
      if (Math.abs(start.y - edge[1].y) <= options.epsilon!) {
        to.y = start.y;
      }
      if (Math.abs(end.x - edge[1].x) <= options.epsilon!) {
        to.x = end.x;
      }
      if (Math.abs(end.y - edge[1].y) <= options.epsilon!) {
        to.y = end.y;
      }
      return [lineIntersect(fromPointsToGeoJSON([start, end]), fromPointsToGeoJSON([from, to])), idx];
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
    })
    .sort(([{ x: x1, y: y1 }], [{ x: x2, y: y2 }]) => {
      return (
        getEuclideanDistanceBetweenPoints(start, { x: x1, y: y1 }) - getEuclideanDistanceBetweenPoints(start, { x: x2, y: y2 })
      );
    })
    .map(([intersection, idx]) => ({
      point: intersection,
      index: idx,
      distance: getEuclideanDistanceBetweenPoints(start, intersection),
    }));
}

function findEdgeWithVertex(vertex: IPoint, edges: Edge[], epsilon = 0.000001): number {
  return edges.findIndex((edge) => {
    return (
      (Math.abs(vertex.x - edge[0].x) <= epsilon && Math.abs(vertex.y - edge[0].y) <= epsilon) ||
      (Math.abs(vertex.x - edge[1].x) <= epsilon && Math.abs(vertex.y - edge[1].y) <= epsilon)
    );
  });
}

function findNextEdge(start: IPoint, edges: Edge[], epsilon = 0.000001): number {
  return edges.findIndex((edge) => {
    return Math.abs(start.x - edge[0].x) <= epsilon && Math.abs(start.y - edge[0].y) <= epsilon;
  });
}

function separateShapes(shapeA: IShape, shapeB: IShape, moveVector: { x: number; y: number }) {
  const minTranslationVector = findMinimumTranslationVector(shapeA, shapeB);

  if (minTranslationVector) {
    const moveVectorMagnitude = Math.sqrt(moveVector.x * moveVector.x + moveVector.y * moveVector.y);
    const unitMoveVector = {
      x: moveVector.x / moveVectorMagnitude,
      y: moveVector.y / moveVectorMagnitude,
    };

    // Project the minimum translation vector onto the move vector
    const projection = minTranslationVector.x * unitMoveVector.x + minTranslationVector.y * unitMoveVector.y;

    return {
      x: unitMoveVector.x * projection,
      y: unitMoveVector.y * projection,
    };
  }

  return minTranslationVector;
}

function findMinimumTranslationVector(shapeA: IShape, shapeB: IShape) {
  const axes = findSeparatingAxes(shapeA, shapeB);
  let minOverlap = Number.POSITIVE_INFINITY;
  let minTranslationVector = null;

  for (const axis of axes) {
    const projectionA = projectShapeOntoAxis(shapeA, axis);
    const projectionB = projectShapeOntoAxis(shapeB, axis);

    const overlap = findOverlap(projectionA, projectionB);
    if (overlap === 0) {
      return null;
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minTranslationVector = {
        x: axis.x * overlap,
        y: axis.y * overlap,
      };

      // Ensure the vector points away from shape B
      const centerA = getShapeCenter(shapeA);
      const centerB = getShapeCenter(shapeB);
      const separation = {
        x: centerA.x - centerB.x,
        y: centerA.y - centerB.y,
      };

      const dotProduct = minTranslationVector.x * separation.x + minTranslationVector.y * separation.y;
      if (dotProduct < 0) {
        minTranslationVector.x = -minTranslationVector.x;
        minTranslationVector.y = -minTranslationVector.y;
      }
    }
  }

  return minTranslationVector;
}

function findSeparatingAxes(shapeA: IShape, shapeB: IShape) {
  const edges = [...shapeToEdgess(shapeA), ...shapeToEdgess(shapeB)];
  const axes = [];

  for (const edge of edges) {
    const normal = {
      x: edge[1].y - edge[0].y,
      y: -(edge[1].x - edge[0].x),
    };

    const magnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    const unitNormal = {
      x: magnitude === 0 ? 1 : normal.x / magnitude,
      y: magnitude === 0 ? 1 : normal.y / magnitude,
    };

    axes.push(unitNormal);
  }

  return axes;
}

function projectShapeOntoAxis(shape: IShape, axis: { x: number; y: number }) {
  let min = axis.x * shape.vertices[0].x + axis.y * shape.vertices[0].y;
  let max = min;

  for (let i = 1; i < shape.vertices.length; i++) {
    const projection = axis.x * shape.vertices[i].x + axis.y * shape.vertices[i].y;
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}

function findOverlap(projectionA: { min: number; max: number }, projectionB: { min: number; max: number }) {
  const overlapA = projectionA.max - projectionB.min;
  const overlapB = projectionB.max - projectionA.min;

  if (overlapA > 0 && overlapB > 0) {
    return Math.min(overlapA, overlapB);
  }

  return 0;
}

function getShapeCenter(shape: IShape) {
  let centerX = 0;
  let centerY = 0;

  for (const vertex of shape.vertices) {
    centerX += vertex.x;
    centerY += vertex.y;
  }

  centerX /= shape.vertices.length;
  centerY /= shape.vertices.length;

  return { x: centerX, y: centerY };
}

function shapeToEdgess(shape: IShape) {
  const edges = [];
  for (let i = 0; i < shape.vertices.length; i++) {
    const p1 = shape.vertices[i];
    const p2 = i === shape.vertices.length - 1 ? shape.vertices[0] : shape.vertices[i + 1];
    edges.push([p1, p2]);
  }
  return edges;
}
