import { DeepPartial, Dictionary, IDictionary, Unique, Void, Volatile } from '@plasmastrapi/base';
import { COMPONENTS, Ctor, ENTITIES, Hereditary, IComponent, IEntity } from '@plasmastrapi/ecs';

export default abstract class Entity extends Unique implements IEntity {
  private __components: IDictionary<IComponent<any>> = new Dictionary();

  protected _parent: Volatile<IEntity>;
  protected _children: IDictionary<IEntity>;

  public constructor() {
    super();
    ENTITIES.register(this);
    this._children = new Dictionary();
  }

  public get $parent(): Volatile<IEntity> {
    return this._parent;
  }

  public set $parent(parent: Volatile<IEntity>) {
    if (this.$parent && parent !== undefined) {
      throw new Error(`${this.constructor.name} already has a parent: ${this.$parent.constructor.name}`);
    }
    this.$parent?.$removeChild(this);
    this._parent = parent;
  }

  public get $children(): IDictionary<IEntity> {
    return this._children;
  }

  public $appendChild<T extends IEntity>(child: T): T {
    this._children.write({ key: child.$id, value: child });
    child.$parent = this;
    return child;
  }

  public $removeChild<T extends IEntity>(child: T): T {
    this._children.delete(child.$id);
    (child as any)._parent = undefined;
    return child;
  }

  @Hereditary
  public $destroy(): void {
    ENTITIES.purge(this);
    this.$forEach((component) => COMPONENTS.purge(component));
    this.$parent?.$removeChild(this);
  }

  public $add<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>, data: TArg): this {
    const component = this.__components.read(ComponentClass.name);
    if (!component) {
      const component = new ComponentClass({ data, entity: this });
      this.__components.write({
        key: ComponentClass.name,
        value: COMPONENTS.register(component),
      });
      return this;
    }
    component.mutate(data);
    return this;
  }

  public $remove<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>): void {
    const component = this.__throwIfMissingComponent(ComponentClass, this.$remove.name);
    this.__components.delete(ComponentClass.name);
    COMPONENTS.purge(component);
  }

  public $has(ComponentClass: Ctor<IComponent<any>, any> | Ctor<IComponent<any>, any>[]): boolean {
    if (ComponentClass instanceof Array) {
      return ComponentClass.reduce((result, component) => {
        return result && this.$has(component);
      }, true);
    }
    return !!this.__components.read(ComponentClass.name);
  }

  public $copy<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>): TArg {
    const component = this.__throwIfMissingComponent(ComponentClass, this.$copy.name);
    return component.copy();
  }

  public $mutate<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>, data: TArg): this {
    const component = this.__throwIfMissingComponent(ComponentClass, this.$mutate.name);
    component.mutate(data);
    return this;
  }

  public $patch<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>, data: DeepPartial<TArg>): this {
    const component = this.__throwIfMissingComponent(ComponentClass, this.$patch.name);
    component.patch(data);
    return this;
  }

  public $get<T extends IComponent<TArg>, TArg extends {}>(ComponentClass: Ctor<T, TArg>): IComponent<TArg> {
    return this.__throwIfMissingComponent(ComponentClass, this.$get.name);
  }

  public $forEach(fn: Void<IComponent<any>>): void {
    return this.__components.forEach(fn);
  }

  private __throwIfMissingComponent<T extends IComponent<TArg>, TArg extends {}>(
    ComponentClass: Ctor<T, TArg>,
    callingMethod: string,
  ): IComponent<TArg> {
    const component = this.__components.read(ComponentClass.name);
    if (!component) {
      throw new Error(`${this.constructor.name} does not have a ${ComponentClass.name} to ${callingMethod}.`);
    }
    return component;
  }
}
