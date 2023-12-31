import { LevelComponent } from '@plasmastrapi/common';
import { IComponentMaster, IEntity, System } from '@plasmastrapi/ecs';
import {
  PoseComponent,
  Shape,
  ShapeComponent,
  GeoJSON,
  booleanOverlap,
  booleanContains,
  IShape,
  geojson,
  difference,
  simplify,
  kinks,
  unkinkPolygon,
  GBOX,
  area,
  centerOfMass,
  entityGetAbsolutePose,
} from '@plasmastrapi/geometry';
import BooleanLevelSubtractorComponent from 'app/components/BooleanLevelSubtractorComponent';
import Terrain from 'app/entities/Terrain';

export class BooleanLevelSubtractorSystem extends System {
  public once({ components }: { components: IComponentMaster }): void {
    components.forEvery(BooleanLevelSubtractorComponent)((subtractor) => {
      components.forEvery(LevelComponent)((levelComponent) => {
        const subtractorShape = Shape.transform(
          subtractor.$entity.$copy(ShapeComponent),
          entityGetAbsolutePose(subtractor.$entity),
        );
        const level = levelComponent.$entity;
        const levelShape = Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent));
        const subtractorGeoJSON = GeoJSON.createFromShape(subtractorShape);
        const levelGeoJSON = GeoJSON.createFromShape(levelShape);
        if (
          booleanOverlap(subtractorGeoJSON, levelGeoJSON) ||
          booleanContains(subtractorGeoJSON, levelGeoJSON) ||
          booleanContains(levelGeoJSON, subtractorGeoJSON)
        ) {
          booleanSubtract(subtractorGeoJSON, level);
          return;
        }
      });
    });
  }
}

function booleanSubtract(subtractorGeoJSON: geojson.Feature<geojson.Polygon, geojson.GeoJsonProperties>, level: IEntity): void {
  const levelGeoJSON = GeoJSON.createFromShape(Shape.transform(level.$copy(ShapeComponent), level.$copy(PoseComponent)));
  const diff = difference(levelGeoJSON, subtractorGeoJSON);
  if (!diff) {
    level.$destroy();
    return;
  }
  const simple = simplify(diff, { tolerance: 1, highQuality: true, mutate: true }) as geojson.Feature<
    geojson.Polygon,
    geojson.GeoJsonProperties
  >;
  let geojsons = [simple];
  if (kinks(simple).features.length) {
    geojsons = (unkinkPolygon(simple) as geojson.FeatureCollection).features as Array<
      geojson.Feature<geojson.Polygon, geojson.GeoJsonProperties>
    >;
  }
  const remainders = geojsons
    .map(Shape.createFromGeoJSON)
    .flat()
    .filter((remainder) => {
      return !(remainder.vertices.length < 3);
    })
    .sort((shape1, shape2) => {
      return area(GeoJSON.createFromShape(shape2)) - area(GeoJSON.createFromShape(shape1));
    });
  if (remainders.length === 0) {
    return level.$destroy();
  }
  transformLevelFragment(level, remainders.shift()!);
  remainders.forEach((remainder) => {
    const fragment = new Terrain({
      centerOfMass: { x: 0, y: 0 },
      shape: { vertices: [] },
    });
    transformLevelFragment(fragment, remainder);
  });
}

const transformLevelFragment = (level: IEntity, remainder: IShape): void => {
  const geojson = GeoJSON.createFromShape(remainder);
  const [x, y] = centerOfMass(geojson).geometry.coordinates;
  level.$patch(ShapeComponent, {
    vertices: remainder.vertices.map((vertex) => ({
      x: vertex.x - x,
      y: vertex.y - y,
    })),
  });
  level.$patch(PoseComponent, { x, y, a: 0 });
};
