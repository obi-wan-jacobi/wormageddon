import { Component } from '@plasmastrapi/ecs';
import { IImage } from '@plasmastrapi/viewport';

export interface IAnimation {
  frame: number;
  images: IImage[];
  isPaused?: boolean;
  isReversed?: boolean;
  isRollback?: boolean;
  durationMs: number;
  $?: {
    tNextFrame: number;
  };
}

export default class AnimationComponent extends Component<IAnimation> {}
