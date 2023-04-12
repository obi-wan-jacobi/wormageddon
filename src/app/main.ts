import { FPSSystem } from '@plasmastrapi/diagnostics';
import App from './App';
import { ImageSystem, LabelSystem, LineSystem, PoseSystem, ShapeSystem } from '@plasmastrapi/engine';
import { InputController } from '@plasmastrapi/html5-canvas';
import AnimationSystem from './systems/AnimationSystem';
import WormController from './controllers/WormController';
import WormInputHandler from './input-handlers/WormInputHandler';
import LevelController from './controllers/LevelController';
import VelocitySystem from './systems/VelocitySystem';
import AccelerationSystem from './systems/AccelerationSystem';
import WormStateSystem from './systems/WormStateSystem';
import WormWalkingSystem from './systems/WormWalkingSystem';

const canvas = document.getElementById('app-target') as HTMLCanvasElement;
canvas.width = 1280;
canvas.height = 720;
canvas.focus();

export const app = new App({
  canvas,
  controllers: {
    input: new InputController({ canvas }),
    worm: new WormController(),
    level: new LevelController(),
  },
  systems: [
    PoseSystem,
    ShapeSystem,
    LineSystem,
    LabelSystem,
    ImageSystem,
    FPSSystem,
    AnimationSystem,
    AccelerationSystem,
    VelocitySystem,
    WormStateSystem,
    WormWalkingSystem,
  ],
});

// walk
app.load('./assets/wwalkL.png');
app.load('./assets/wwalkR.png');
// breathe
app.load('./assets/wbrth1L.png');
app.load('./assets/wbrth1LD.png');
app.load('./assets/wbrth1LU.png');
app.load('./assets/wbrth1R.png');
app.load('./assets/wbrth1RD.png');
app.load('./assets/wbrth1RU.png');
// jump
app.load('./assets/wjumpL.png');
app.load('./assets/wjumpR.png');

app.init();
app.controllers.input.setHandler(WormInputHandler);
app.start();
