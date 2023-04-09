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
  ],
});

app.load('./assets/wwalk.png');
app.load('./assets/wwalkR.png');

app.init();
app.controllers.input.setHandler(WormInputHandler);
app.start();
