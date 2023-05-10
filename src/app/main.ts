import { FPSSystem } from '@plasmastrapi/diagnostics';
import App from './App';
import { ImageSystem, LabelSystem, LineSystem, PoseSystem, ShapeSystem } from '@plasmastrapi/engine';
import { InputController } from '@plasmastrapi/html5-canvas';
import WormController from './controllers/WormController';
import WormInputHandler from './input-handlers/WormInputHandler';
import LevelController from './controllers/LevelController';
import WormStateSystem from './systems/WormStateSystem';
import WormWalkingSystem from './systems/WormWalkingSystem';
import { AccelerationSystem, GravitySystem, ImpulseSystem, VelocitySystem } from '@plasmastrapi/physics';
import WormHeadingSystem from './systems/WormHeadingSystem';
import { AnimationSystem } from '@plasmastrapi/animation';
import WormVelocitySystem from './systems/WormVelocitySystem';
import WormReticleSystem from './systems/WormReticleSystem';
import WormCollisionSystem from './systems/WormCollisionSystem';
import HandleController from './controllers/HandleController';
import HandleInputHandler from './input-handlers/HandleInputHandler';

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
    handle: new HandleController(),
  },
  systems: [
    PoseSystem,
    ShapeSystem,
    LineSystem,
    LabelSystem,
    ImageSystem,
    AnimationSystem,
    FPSSystem,
    ImpulseSystem,
    GravitySystem,
    AccelerationSystem,
    VelocitySystem,

    WormCollisionSystem,
    WormVelocitySystem,
    WormHeadingSystem,
    WormStateSystem,
    WormWalkingSystem,
    WormReticleSystem,
  ],
});

// breathe
app.load('./assets/idle/wbrth1L.png');
app.load('./assets/idle/wbrth1LD.png');
app.load('./assets/idle/wbrth1LU.png');
app.load('./assets/idle/wbrth1R.png');
app.load('./assets/idle/wbrth1RD.png');
app.load('./assets/idle/wbrth1RU.png');
// walk
app.load('./assets/walk/wwalkL.png');
app.load('./assets/walk/wwalkLD.png');
app.load('./assets/walk/wwalkLU.png');
app.load('./assets/walk/wwalkR.png');
app.load('./assets/walk/wwalkRD.png');
app.load('./assets/walk/wwalkRU.png');
// jump
app.load('./assets/jump/wjumpL.png');
app.load('./assets/jump/wjumpLD.png');
app.load('./assets/jump/wjumpLU.png');
app.load('./assets/jump/wjumpR.png');
app.load('./assets/jump/wjumpRD.png');
app.load('./assets/jump/wjumpRU.png');
// arc
app.load('./assets/arc/warcL.png');
app.load('./assets/arc/warcR.png');
// land
app.load('./assets/land/wland1L.png');
app.load('./assets/land/wland1LD.png');
app.load('./assets/land/wland1LU.png');
app.load('./assets/land/wland1R.png');
app.load('./assets/land/wland1RD.png');
app.load('./assets/land/wland1RU.png');
// slide
app.load('./assets/slide/wslideL.png');
app.load('./assets/slide/wslideLD.png');
app.load('./assets/slide/wslideLU.png');
app.load('./assets/slide/wslideR.png');
app.load('./assets/slide/wslideRD.png');
app.load('./assets/slide/wslideRU.png');
// crosshair
app.load('./assets/crshairr.png');

app.init();
app.controllers.input.setHandler(HandleInputHandler);
app.start();
