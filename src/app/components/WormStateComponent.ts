import { Component } from '@plasmastrapi/ecs';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';

export interface IWormState {
  facing: 'L' | 'R';
  heading: '' | 'D' | 'U';
  action: WORM_ACTION;
  stored?: {
    facing: 'L' | 'R';
    action: WORM_ACTION;
  };
  tNextAction?: number;
  $?: {
    previous: {
      facing: 'L' | 'R';
      heading: '' | 'D' | 'U';
      action: WORM_ACTION;
    };
  };
}

export default class WormStateComponent extends Component<IWormState> {}
