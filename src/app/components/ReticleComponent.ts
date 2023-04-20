import { Component } from '@plasmastrapi/ecs';
import { IImage } from '@plasmastrapi/viewport';

export interface IReticle {
  angle: number;
  distance: number;
  offset: { x: number; y: number };
  images: IImage[];
}

export default class ReticleComponent extends Component<IReticle> {}
