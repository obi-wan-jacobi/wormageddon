import { Component } from '@plasmastrapi/ecs';

export interface IFacing {
  direction: 'LEFT' | 'RIGHT';
}

export default class FacingComponent extends Component<IFacing> {}
