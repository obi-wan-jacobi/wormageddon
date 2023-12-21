import { clone, isDeepEqual, rotateArray } from '@plasmastrapi/base';
import {
  EDGE_TYPE,
  Edge,
  GBOX,
  GeoJSON,
  IPoint,
  IPose,
  IShape,
  Point,
  Shape,
  booleanPointInPolygon,
} from '@plasmastrapi/geometry';
import { Epsilon } from '@plasmastrapi/math';
import { COLOUR, IStyle, IViewport } from '@plasmastrapi/viewport';
import { highlightEdge, highlightPoint } from './utils';

const STYLE_GREEN = { colour: 'lightgreen', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_GREEN_BIG = { colour: 'lightgreen', fill: 'lightgreen', opacity: 1, zIndex: 9999 };
const STYLE_RED = { colour: 'red', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_RED_BIG = { colour: 'red', fill: 'red', opacity: 1, zIndex: 9999 };
const STYLE_YELLOW = { colour: 'yellow', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_BLUE = { colour: 'blue', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_WHITE = { colour: 'white', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_PINK = { colour: 'pink', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };
const STYLE_ORANGE = { colour: 'orange', fill: COLOUR.RGBA_0, opacity: 1, zIndex: 9999 };

export function extrude(shape: IShape, from: IPose, to: IPose, epsilon = 0.000001, viewport?: IViewport): IShape {
  if (to.x === from.x) {
    to.x += 0.00001;
  }
  if (to.y === from.y) {
    to.y += 0.00001;
  }
  if (to.y < from.y) {
    [from, to] = [to, from];
  }
  const shapeA = Shape.transform(shape, from);
  const shapeB = Shape.transform(shape, to);
  const gbox = GBOX.combine(GBOX.create(shapeA), GBOX.create(shapeB));
  let a = shapeA.vertices;
  let b = shapeB.vertices;
  let d = a.map((vertex, i) => [vertex, b[i]] as Edge);
  let smallestDistance = Number.POSITIVE_INFINITY;
  let idx = 0;
  for (let i = 0, L = d.length; i < L; i++) {
    const distance = Point.getEuclideanDistanceBetweenPoints(gbox.v1, d[i][0]);
    if (distance < smallestDistance) {
      idx = i;
      smallestDistance = distance;
    }
  }
  d = rotateArray(d, idx);
  a = rotateArray(a, idx);
  b = rotateArray(b, idx);
  let edgesA = Shape.toEdges({ vertices: a });
  let edgesB = Shape.toEdges({ vertices: b });
  let newEdges: Edge[] = [];
  const geosA = GeoJSON.createFromShape(shapeA);
  const geosB = GeoJSON.createFromShape(shapeB);
  let startingEdge: Edge | undefined;
  for (let i = 0, L = a.length; i < L; i++) {
    const intersectionA = Shape.findEdgeIntersection(a[i], b[i], edgesA, { epsilon, isIncludeEnd: true });
    const intersectionB = Shape.findEdgeIntersection(b[i], a[i], edgesB, { epsilon, isIncludeEnd: true });
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
          startingEdge = [a[i], b[i], EDGE_TYPE.CONJOINING];
        }
        newEdges.push([a[i], b[i], EDGE_TYPE.CONJOINING]);
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
    const intersectionsB = Shape.findAllEdgeIntersections(edge[0], edge[1], edgesB, { epsilon });
    const end = clone(edge[1]);
    while (intersectionsB.length) {
      const intersectionB = intersectionsB.shift()!;
      if (!Epsilon.isRoughlyEqual(intersectionB.point, { x: edge[1].x, y: edge[1].y }, epsilon)) {
        newEdgesA.push([intersectionB.point, end]);
        newEdgesA[newEdgesA.length - 2][1] = intersectionB.point;
      }
    }
  }
  const newEdgesB: Edge[] = [];
  for (let i = 0; i < edgesB.length; i++) {
    const edge = clone(edgesB[i]);
    newEdgesB.push(edge);
    const intersectionsA = Shape.findAllEdgeIntersections(edge[0], edge[1], edgesA, { epsilon });
    const end = clone(edge[1]);
    while (intersectionsA.length) {
      const intersectionA = intersectionsA.shift()!;
      if (!Epsilon.isRoughlyEqual(intersectionA.point, { x: edge[1].x, y: edge[1].y }, epsilon)) {
        newEdgesB.push([intersectionA.point, end]);
        newEdgesB[newEdgesB.length - 2][1] = intersectionA.point;
      }
    }
  }
  for (let i = 0; i < newEdgesA.length; i++) {
    const edge = newEdgesA[i];
    const intersectionE = Shape.findEdgeIntersection(edge[0], edge[1], newEdges, { epsilon, isIncludeEnd: true });
    if (intersectionE) {
      if (!Epsilon.isRoughlyEqual(intersectionE.point as any, clone(edge[1]), epsilon)) {
        newEdgesA.splice(i + 1, 0, [intersectionE.point, clone(edge[1])]);
        edge[1] = intersectionE.point;
        i++;
      }
    }
  }
  for (let i = 0; i < newEdgesB.length; i++) {
    const edge = newEdgesB[i];
    const intersectionE = Shape.findEdgeIntersection(edge[0], edge[1], newEdges, { epsilon, isIncludeEnd: true });
    if (intersectionE) {
      if (!Epsilon.isRoughlyEqual(intersectionE.point as any, clone(edge[1]), epsilon)) {
        newEdgesB.splice(i + 1, 0, [intersectionE.point, clone(edge[1])]);
        edge[1] = intersectionE.point;
        i++;
      }
    }
  }
  edgesA = newEdgesA;
  edgesB = newEdgesB;
  for (const edge of edgesA) {
    highlightPoint(viewport, edge[0], STYLE_GREEN);
  }
  for (const edge of edgesB) {
    highlightPoint(viewport, edge[0], STYLE_BLUE);
  }
  idx = newEdges.findIndex((edge) => isDeepEqual(edge, startingEdge!));
  newEdges = rotateArray(newEdges, idx);
  idx = Shape.findNextEdge(newEdges[0][0], edgesA, epsilon);
  edgesA = rotateArray(edgesA, idx);
  idx = Shape.findNextEdge(newEdges[0][1], edgesB, epsilon);
  edgesB = rotateArray(edgesB, idx);
  const extrusionEdges: Edge[] = [];
  while (edgesA.length && edgesB.length && newEdges.length) {
    const edge = edgesA.shift()!;
    extrusionEdges.push(edge);
    const idxE = Shape.findEdgeWithVertex(edge[1], newEdges, epsilon);
    if (idxE > -1) {
      if (newEdges[idxE][2] === EDGE_TYPE.CONJOINING) {
        [edgesA, edgesB] = [edgesB, edgesA];
      }
      // const vertex0 =
      //   edge[1].x === newEdges[idxE][0].x && edge[1].y === newEdges[idxE][0].y ? newEdges[idxE][0] : newEdges[idxE][1];
      const vertex1 =
        edge[1].x === newEdges[idxE][0].x && edge[1].y === newEdges[idxE][0].y ? newEdges[idxE][1] : newEdges[idxE][0];
      const idxA = Shape.findNextEdge(vertex1, edgesA, epsilon);
      extrusionEdges.push(newEdges.splice(idxE, 1)[0]);
      let counter = idxA || 0;
      while (counter > 0) {
        edgesA.shift();
        counter--;
      }
      continue;
    }
    const idxB = Shape.findNextEdge(edge[1], edgesB, epsilon);
    if (idxB > -1) {
      let counter = idxB;
      while (counter > 0) {
        edgesB.shift();
        counter--;
      }
      [edgesA, edgesB] = [edgesB, edgesA];
    }
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
  const vertices: IPoint[] = [];
  for (let i = 0, L = extrusionEdges.length; i < L - 1; i++) {
    vertices.push(extrusionEdges[i][0]);
    vertices.push(extrusionEdges[i][1]);
    if (Epsilon.isRoughlyEqual(extrusionEdges[i][1] as any, extrusionEdges[i + 1][0], epsilon)) {
      i++;
    }
  }
  return {
    vertices,
  };
}
