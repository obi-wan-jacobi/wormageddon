import { Component } from '@plasmastrapi/ecs';
import { IImage } from '@plasmastrapi/engine';

export interface IAnimation {
  frame: number;
  images: IImage[];
  isPaused?: boolean;
  isReversed?: boolean;
  isRollback?: boolean;
  durationMs: number;
}

export default class AnimationComponent extends Component<IAnimation> {}
