import { IHTML5CanvasElement, IMouseEvent, MOUSE_EVENT, Observable } from '@plasmastrapi/html5-canvas';
import Entity from './Entity';
import { Dictionary, IDictionary, Void } from '@plasmastrapi/base';
import { PoseComponent } from '@plasmastrapi/geometry';
import { StyleComponent } from '@plasmastrapi/graphics';
import { COLOUR } from '@plasmastrapi/viewport';

export default class HTML5CanvasElement extends Entity implements IHTML5CanvasElement {
  protected _observedMethods: IDictionary<IDictionary<Void<any>>>;

  public constructor() {
    super();
    this._observedMethods = new Dictionary<Dictionary<Void<void>>>();
    this.$add(PoseComponent, { x: 0, y: 0, a: 0 });
    this.$add(StyleComponent, {
      colour: COLOUR.RGBA_WHITE,
      fill: COLOUR.RGBA_0,
      opacity: 1,
      zIndex: 0,
    });
  }

  public $subscribe({ method, id, callback }: { method: string; id: string; callback: () => void }): void {
    if (!(this as any)[method]) {
      throw new Error(`Method not implemented: ${method}`);
    }
    const subscribers = this._observedMethods.read(method);
    if (subscribers) {
      if (subscribers.read(id)) {
        throw new Error(`ID <${id}> is already subscribed to method <${method}> on ${this.constructor.name}.`);
      }
      subscribers.write({ key: id, value: callback });
      return;
    }
    const innerDictionary = new Dictionary<() => void>();
    innerDictionary.write({ key: id, value: callback });
    this._observedMethods.write({ key: method, value: innerDictionary });
  }

  public $unsubscribe({ method, id }: { method: string; id: string }): void {
    if (!(this as any)[method]) {
      throw new Error(`Method not implemented: ${method}`);
    }
    const subscribers = this._observedMethods.read(method);
    if (!subscribers) {
      throw new Error(`ID <${id}> is not subscribed to method <${method}> on ${this.constructor.name}.`);
    }
    subscribers.delete(id);
  }

  @Observable
  [MOUSE_EVENT.MOUSE_DOWN](event: IMouseEvent): void {
    console.log(event.name, this.$id);
  }

  @Observable
  [MOUSE_EVENT.MOUSE_UP](event: IMouseEvent): void {
    console.log(event.name, this.$id);
  }

  @Observable
  [MOUSE_EVENT.CLICK](event: IMouseEvent): void {
    console.log(event.name, this.$id);
  }

  @Observable
  [MOUSE_EVENT.MOUSE_MOVE](event: IMouseEvent): void {
    console.log(event.name, this.$id);
  }

  @Observable
  [MOUSE_EVENT.MOUSE_ENTER](event: IMouseEvent): void {
    console.log(event.name, this.$id);
  }

  @Observable
  [MOUSE_EVENT.MOUSE_LEAVE](event: IMouseEvent): void {
    console.log(event.name, this.$id);
  }

  @Observable
  public $destroy(): void {
    super.$destroy();
  }
}
