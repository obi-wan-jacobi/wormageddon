import { FPSSystem } from '@plasmastrapi/diagnostics';
import App from './App';
import { AnimationSystem, ImageSystem, LabelSystem, LineSystem, PoseSystem, ShapeSystem } from '@plasmastrapi/engine';
import { InputController } from '@plasmastrapi/html5-canvas';
import DefaultInputHandler from './input-handlers/DefaultInputHandler';

const canvas = document.getElementById('app-target') as HTMLCanvasElement;
canvas.width = 1280;
canvas.height = 720;
canvas.focus();

export const app = new App({
  canvas,
  controllers: {
    input: new InputController({ canvas }),
  },
  systems: [PoseSystem, ShapeSystem, LineSystem, LabelSystem, ImageSystem, AnimationSystem, FPSSystem],
});

app.init();
app.controllers.input.setHandler(DefaultInputHandler);
app.start();
