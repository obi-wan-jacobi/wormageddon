import { Component } from '@plasmastrapi/ecs';

export interface IChild {
  pose: 'relative' | 'absolute';
}

export default class ChildComponent extends Component<IChild> {}
