import { PoseComponent } from '@plasmastrapi/geometry';
import { IController } from '@plasmastrapi/html5-canvas';
import Atom from 'app/entities/Atom';

export default class AtomController implements IController {
  private __atom: Atom;
  private __isClicked = false;

  public init(): void {
    // this.__atom = new Atom({ x: 500, y: 100 });
    this.__atom = new Atom({ x: 975, y: 243.51998901367188 });
  }

  public click(event: MouseEvent): void {
    this.__isClicked = !this.__isClicked;
  }

  public mousemove(event: MouseEvent): void {
    if (!this.__isClicked) {
      return;
    }
    this.__atom.$patch(PoseComponent, { x: event.x, y: event.y });
  }
}
