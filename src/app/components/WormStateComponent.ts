import { Component } from '@plasmastrapi/ecs';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';
import { WORM_HEADING } from 'app/enums/WORM_HEADING';

export interface IWormState {
  heading: WORM_HEADING;
  facing: WORM_FACING;
  action: WORM_ACTION;
  stored?: {
    facing: WORM_FACING;
    action: WORM_ACTION;
  };
  $?: {
    previous?: {
      heading: WORM_HEADING;
      facing: WORM_FACING;
      action: WORM_ACTION;
    };
    tNextAction?: number;
  };
}

export default class WormStateComponent extends Component<IWormState> {}
