import { Component } from '@plasmastrapi/ecs';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { WORM_FACING } from 'app/enums/WORM_FACING';

export interface IWormState {
  facing: WORM_FACING;
  action: WORM_ACTION;
  stored?: {
    facing: WORM_FACING;
    action: WORM_ACTION;
  };
  previous?: {
    facing: WORM_FACING;
    action: WORM_ACTION;
  };
}

export default class WormStateComponent extends Component<IWormState> {}
