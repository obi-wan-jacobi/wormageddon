import App from './App';
import WormController from './controllers/WormController';
import WormInputHandler from './input-handlers/WormInputHandler';
import LevelController from './controllers/LevelController';
import WormStateSystem from './systems/WormStateSystem';
import WormWalkingSystem from './systems/WormWalkingSystem';
import { AccelerationSystem, GravitySystem, PoseSystem, VelocitySystem } from '@plasmastrapi/physics';
import WormHeadingSystem from './systems/WormHeadingSystem';
import ReticleSystem from './systems/ReticleSystem';
import PikumaSystem from './systems/PikumaSystem';
import { AnimationSystem, ImageSystem, LabelSystem, LineSystem, ShapeSystem } from '@plasmastrapi/graphics';
import { FPSSystem } from '@plasmastrapi/diagnostics';
import VisualsSystem from './systems/VisualsSystem';
import AtomSystem from './systems/AtomSystem';
import AtomController from './controllers/AtomController';
import AtomInputHandler from './input-handlers/AtomInputHandler';
import ViewportController from './controllers/ViewportController';
import ViewportInputHandler from './input-handlers/ViewportInputHandler';
import InputController from './InputController';
import { BooleanLevelSubtractorSystem } from './systems/BooleanLevelSubtractorSystem';

const canvas = document.getElementById('app-target') as HTMLCanvasElement;
canvas.width = 1280;
canvas.height = 720;
canvas.focus();

export const app = new App({
  canvas,
  controllers: {
    // atom: new AtomController(),
    input: new InputController({ canvas }),
    level: new LevelController(),
    viewport: new ViewportController(),
    worm: new WormController(),
  },
  systems: [
    PoseSystem,
    ShapeSystem,
    LineSystem,
    LabelSystem,
    ImageSystem,
    // AnimationSystem,
    FPSSystem,
    GravitySystem,
    AccelerationSystem,
    VelocitySystem,

    // AtomSystem,
    PikumaSystem,
    WormHeadingSystem,
    WormStateSystem,
    WormWalkingSystem,
    ReticleSystem,
    VisualsSystem,
    BooleanLevelSubtractorSystem,
  ],
});

[
  // air
  './assets/fly/wflyLD.png',
  './assets/fly/wflyRD.png',
  // arc
  './assets/arc/warcL.png',
  './assets/arc/warcR.png',
  // fall
  './assets/fall/wfallL.png',
  './assets/fall/wfallR.png',
  // idle
  './assets/idle/wbrth1L.png',
  './assets/idle/wbrth1LD.png',
  './assets/idle/wbrth1LU.png',
  './assets/idle/wbrth1R.png',
  './assets/idle/wbrth1RD.png',
  './assets/idle/wbrth1RU.png',
  // jump
  './assets/jump/wjumpL.png',
  './assets/jump/wjumpLD.png',
  './assets/jump/wjumpLU.png',
  './assets/jump/wjumpR.png',
  './assets/jump/wjumpRD.png',
  './assets/jump/wjumpRU.png',
  // land
  './assets/land/wland1L.png',
  './assets/land/wland1LD.png',
  './assets/land/wland1LU.png',
  './assets/land/wland1R.png',
  './assets/land/wland1RD.png',
  './assets/land/wland1RU.png',
  // walk
  './assets/walk/wwalkL.png',
  './assets/walk/wwalkLD.png',
  './assets/walk/wwalkLU.png',
  './assets/walk/wwalkR.png',
  './assets/walk/wwalkRD.png',
  './assets/walk/wwalkRU.png',
].forEach((src) => app.load(src));

[
  // crosshair
  './assets/crshairr.png',
].forEach((src) => app.load(src));

app.init();
app.controllers.input.setHandlers([
  [ViewportInputHandler, {}],
  [WormInputHandler, {}],
]);
// app.controllers.input.setHandler(AtomInputHandler);
app.start();
