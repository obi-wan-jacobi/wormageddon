/* eslint-disable @typescript-eslint/naming-convention */
import { DeepPartial } from '@plasmastrapi/base';
import { Ctor, IComponent } from '@plasmastrapi/ecs';
import { IPoint, PoseComponent, ShapeComponent } from '@plasmastrapi/geometry';
import { AnimationComponent } from '@plasmastrapi/graphics';
import { IHTML5CanvasElement } from '@plasmastrapi/html5-canvas';
import { AccelerationComponent, GravityComponent, PhysicalComponent, VelocityComponent } from '@plasmastrapi/physics';
import { CONSTANTS } from 'app/CONSTANTS';
import HTML5CanvasElement from 'app/HTML5CanvasElement';
import ReticleComponent from 'app/components/ReticleComponent';
import WormStateComponent from 'app/components/WormStateComponent';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { WORM_HEADING } from 'app/enums/WORM_HEADING';
import { buildFrames } from 'app/helpers/helpers';

export default class Worm extends HTML5CanvasElement {
  private __animationAnchor: IHTML5CanvasElement;

  public constructor({ x, y }: IPoint) {
    super();
    this.$add(PoseComponent, { x, y, a: 0 });
    this.$add(ShapeComponent, {
      vertices: [
        { x: -0.05, y: -CONSTANTS.WORM.HALF_HEIGHT },
        { x: 0.05, y: -CONSTANTS.WORM.HALF_HEIGHT },
        { x: 0, y: CONSTANTS.WORM.HALF_HEIGHT },
      ],
    });
    this.$add(WormStateComponent, {
      heading: WORM_HEADING.STRAIGHT,
      facing: WORM_FACING.RIGHT,
      action: WORM_ACTION.FALL,
    });
    this.$add(PhysicalComponent, { mass: 1, invMass: 1, I: 1, invI: 1 });
    this.$add(VelocityComponent, { x: 0, y: 0, w: 0 });
    this.$add(AccelerationComponent, { x: 0, y: 0, w: 0 });
    this.$add(GravityComponent, { x: 0, y: CONSTANTS.GRAVITY });
    this.$add(ReticleComponent, {
      angle: 0,
      distance: 50,
      images: buildFrames('./assets/crshairr.png', 60, 60, 1920, { x: -30, y: -30 }),
      offset: { x: 0, y: 0 },
    });
    this.__animationAnchor = new HTML5CanvasElement();
    this.__animationAnchor.$add(PoseComponent, { x: 0, y: 0, a: 0 });
    this.__animationAnchor.$add(AnimationComponent, {
      images: [],
      frame: 0,
      durationMs: 0,
    });
    this.$appendChild(this.__animationAnchor);
  }

  public $add<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>, data: TArg): this {
    if (ComponentClass.name === AnimationComponent.name) {
      this.__animationAnchor.$add(ComponentClass, data);
      return this;
    }
    return super.$add(ComponentClass, data);
  }

  public $remove<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>): void {
    if (ComponentClass.name === AnimationComponent.name) {
      this.__animationAnchor.$remove(ComponentClass);
      return;
    }
    return super.$remove(ComponentClass);
  }

  public $has<T extends IComponent<TArg>, TArg extends {}>(
    ComponentClass: Ctor<T, TArg> | Ctor<IComponent<any>, any>[],
  ): boolean {
    if (!Array.isArray(ComponentClass)) {
      if ((ComponentClass as Ctor<T, TArg>).name === AnimationComponent.name) {
        return this.__animationAnchor.$has(ComponentClass);
      }
      return super.$has(ComponentClass);
    }
    if (ComponentClass.includes(AnimationComponent)) {
      const ComponentClasses = ComponentClass.filter((ComponentClass) => ComponentClass !== AnimationComponent);
      return this.__animationAnchor.$has(ComponentClass) && super.$has(ComponentClasses);
    }
    return super.$has(ComponentClass);
  }

  public $copy<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>): TArg {
    if (ComponentClass.name === AnimationComponent.name) {
      return this.__animationAnchor.$copy(ComponentClass);
    }
    return super.$copy(ComponentClass);
  }

  public $mutate<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>, data: TArg): this {
    if (ComponentClass.name === AnimationComponent.name) {
      this.__animationAnchor.$mutate(ComponentClass, data);
      return this;
    }
    return super.$mutate(ComponentClass, data);
  }

  public $patch<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>, data: DeepPartial<TArg>): this {
    if (ComponentClass.name === AnimationComponent.name) {
      this.__animationAnchor.$patch(ComponentClass, data);
      return this;
    }
    return super.$patch(ComponentClass, data);
  }

  public $get<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>): IComponent<TArg> {
    if (ComponentClass.name === AnimationComponent.name) {
      return this.__animationAnchor.$get(ComponentClass);
    }
    return super.$get(ComponentClass);
  }
}
