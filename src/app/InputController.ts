import { Constructor, Index, Void } from '@plasmastrapi/base';
import {
  IController,
  IEvent,
  IHTML5EventTransform,
  IInputHandler,
  IKeyboardEvent,
  IMouseEvent,
  KEYBOARD_EVENT,
  MOUSE_EVENT,
} from '@plasmastrapi/html5-canvas';

export default class InputController implements IController {
  private __canvas: HTMLCanvasElement;
  private __handlers: IInputHandler[] = [];
  private __mouse: IMouseEvent = {} as IMouseEvent;
  private __keyboard: IKeyboardEvent = {} as IKeyboardEvent;

  public constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    this.__canvas = canvas;
  }

  public init(): void {
    bindEvents({
      element: this.__canvas,
      eventNames: Object.keys(MOUSE_EVENT).map((event) => (MOUSE_EVENT as Index<string>)[event]),
      eventMapper: adaptCanvasMouseEvent,
      callback: this.__handleMouseEvent.bind(this),
    });
    bindEvents({
      element: this.__canvas,
      eventNames: Object.keys(KEYBOARD_EVENT).map((event) => (KEYBOARD_EVENT as Index<string>)[event]),
      eventMapper: adaptCanvasKeyboardEvent,
      callback: this.__handleKeyboardEvent.bind(this),
    });
  }

  public setHandlers<TArgs>(HandlerConstructorTuples: [Constructor<IInputHandler, TArgs>, TArgs][]): void {
    this.__handlers.forEach((handler) => handler.dispose());
    this.__handlers = HandlerConstructorTuples.map(([Handler, args]) => new Handler(args || ({} as TArgs)));
    this.__handlers.forEach((handler) => handler.init({ x: this.__mouse.x, y: this.__mouse.y }));
  }

  private __handleMouseEvent(event: IMouseEvent): void {
    this.__mouse = event;
    // cache handler now because some events might otherwise set a new handler
    // "before" this one has a chance to execute on this event
    const handlers = this.__handlers;
    handlers.forEach((handler) => {
      if (handler[event.name]) {
        handler[event.name](event);
      }
    });
  }

  private __handleKeyboardEvent(event: IKeyboardEvent): void {
    this.__keyboard = event;
    // cache handler now because some events might otherwise set a new handler
    // "before" this one has a chance to execute on this event
    const handlers = this.__handlers;
    handlers.forEach((handler) => {
      if (handler[event.name]) {
        handler[event.name](event);
      }
    });
  }
}

const bindEvents = <TSourceEvent extends Event, TAdaptedEvent extends IEvent>({
  element,
  eventNames,
  eventMapper,
  callback,
}: IHTML5EventTransform<HTMLCanvasElement, TSourceEvent, TAdaptedEvent>): void => {
  eventNames.forEach((name) => {
    (element as unknown as Index<Void<TSourceEvent>>)[`on${name}`] = (event: TSourceEvent): void => {
      const adaptedEvent = eventMapper({
        event,
        element,
      });
      callback(adaptedEvent);
    };
  });
};

const adaptCanvasMouseEvent = ({ event, element }: { event: MouseEvent; element: HTMLCanvasElement }): IMouseEvent => {
  const boundingClientRect = element.getBoundingClientRect();
  return {
    name: event.type,
    x: event.clientX - boundingClientRect.left,
    y: event.clientY - boundingClientRect.top,
    isCtrlDown: event.ctrlKey,
    isShiftDown: event.shiftKey,
  };
};

const adaptCanvasKeyboardEvent = ({ event }: { event: KeyboardEvent }): IKeyboardEvent => ({
  name: event.type,
  key: event.key,
  isCtrlDown: event.ctrlKey,
  isShiftDown: event.shiftKey,
});
