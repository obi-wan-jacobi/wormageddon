import { IWeapon } from 'app/components/WeaponComponent';
import { WEAPON_NAME } from 'app/enums/WEAPON_NAME';
import { WORM_ACTION } from 'app/enums/WORM_ACTION';
import { buildFrames } from 'app/helpers/helpers';

const blowtorch: IWeapon = {
  name: WEAPON_NAME.BLOWTORCH,
  isEquipped: false,
  aimingIncrementsInDegrees: [-30, 0, 22],
  images: {
    [WORM_ACTION.IDLE]: {
      L: buildFrames('./assets/weapons/blowtorch/wblowL.png', 60, 60, 300, { x: -30, y: -30 }),
      LD: buildFrames('./assets/weapons/blowtorch/wblowLD.png', 60, 60, 300, { x: -30, y: -30 }),
      LU: buildFrames('./assets/weapons/blowtorch/wblowLU.png', 60, 60, 300, { x: -30, y: -30 }),
      R: buildFrames('./assets/weapons/blowtorch/wblowR.png', 60, 60, 300, { x: -30, y: -30 }),
      RD: buildFrames('./assets/weapons/blowtorch/wblowRD.png', 60, 60, 300, { x: -30, y: -30 }),
      RU: buildFrames('./assets/weapons/blowtorch/wblowRU.png', 60, 60, 300, { x: -30, y: -30 }),
    },
    [WORM_ACTION.EQUIP]: {
      L: buildFrames('./assets/weapons/blowtorch/wblowlkL.png', 60, 60, 900, { x: -30, y: -30 }),
      LD: buildFrames('./assets/weapons/blowtorch/wblowlkLD.png', 60, 60, 900, { x: -30, y: -30 }),
      LU: buildFrames('./assets/weapons/blowtorch/wblowlkLU.png', 60, 60, 900, { x: -30, y: -30 }),
      R: buildFrames('./assets/weapons/blowtorch/wblowlkR.png', 60, 60, 900, { x: -30, y: -30 }),
      RD: buildFrames('./assets/weapons/blowtorch/wblowlkRD.png', 60, 60, 900, { x: -30, y: -30 }),
      RU: buildFrames('./assets/weapons/blowtorch/wblowlkRU.png', 60, 60, 900, { x: -30, y: -30 }),
    },
    [WORM_ACTION.FIRE]: {
      L: buildFrames('./assets/weapons/blowtorch/wblowwL.png', 80, 80, 1200, { x: -40, y: -40 }, -0.667),
      LD: buildFrames('./assets/weapons/blowtorch/wblowwLD.png', 80, 80, 1200, { x: -40, y: -40 }, -0.667),
      LU: buildFrames('./assets/weapons/blowtorch/wblowwLU.png', 80, 80, 1200, { x: -40, y: -40 }, -0.667),
      R: buildFrames('./assets/weapons/blowtorch/wblowwR.png', 80, 80, 1200, { x: -40, y: -40 }, 0.667),
      RD: buildFrames('./assets/weapons/blowtorch/wblowwRD.png', 80, 80, 1200, { x: -40, y: -40 }, 0.667),
      RU: buildFrames('./assets/weapons/blowtorch/wblowwRU.png', 80, 80, 1200, { x: -40, y: -40 }, 0.667),
    },
    [WORM_ACTION.UNEQUIP]: {
      L: buildFrames('./assets/weapons/blowtorch/wblowbkL.png', 60, 60, 900, { x: -30, y: -30 }),
      LD: buildFrames('./assets/weapons/blowtorch/wblowbkLD.png', 60, 60, 900, { x: -30, y: -30 }),
      LU: buildFrames('./assets/weapons/blowtorch/wblowbkLU.png', 60, 60, 900, { x: -30, y: -30 }),
      R: buildFrames('./assets/weapons/blowtorch/wblowbkR.png', 60, 60, 900, { x: -30, y: -30 }),
      RD: buildFrames('./assets/weapons/blowtorch/wblowbkRD.png', 60, 60, 900, { x: -30, y: -30 }),
      RU: buildFrames('./assets/weapons/blowtorch/wblowbkRU.png', 60, 60, 900, { x: -30, y: -30 }),
    },
  },
};

export default blowtorch;
