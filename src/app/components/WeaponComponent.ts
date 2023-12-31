import { Component } from '@plasmastrapi/ecs';
import { IImage } from '@plasmastrapi/viewport';
import { WEAPON_NAME } from 'app/enums/WEAPON_NAME';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';

interface IDirectionalImagesDict {
  L: IImage[];
  LD: IImage[];
  LU: IImage[];
  R: IImage[];
  RD: IImage[];
  RU: IImage[];
}

export interface IWeapon {
  name: WEAPON_NAME;
  isEquipped: boolean;
  aimingIndex?: number;
  aimingIncrementsInDegrees?: number[];
  images: {
    [WORM_ACTION.IDLE]: IDirectionalImagesDict;
    [WORM_ACTION.EQUIP]: IDirectionalImagesDict;
    [WORM_ACTION.UNEQUIP]: IDirectionalImagesDict;
    [WORM_ACTION.FIRE]: IDirectionalImagesDict;
  };
}

export default class WeaponComponent extends Component<IWeapon> {}
