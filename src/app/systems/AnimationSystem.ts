import { IComponentMaster, IEntity } from '@plasmastrapi/ecs';
import { getAbsolutePose } from '@plasmastrapi/geometry';
import AnimationComponent, { IAnimation } from '../components/AnimationComponent';
import { IViewport, RenderingSystem } from '@plasmastrapi/engine';

export default class AnimationSystem extends RenderingSystem {
  public draw({ viewport, components }: { viewport: IViewport<any>; components: IComponentMaster }): void {
    components.forEvery(AnimationComponent)((animation) => {
      const now = Date.now();
      const pose = getAbsolutePose(animation.$entity as IEntity);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const animationData = animation.copy() as IAnimation & { __tNextFrame?: number };
      if (animationData.__tNextFrame === undefined) {
        animationData.__tNextFrame = now + animationData.durationMs;
      }
      if (!animationData.isPaused && now >= animationData.__tNextFrame) {
        animationData.__tNextFrame = now + animationData.durationMs;
        if (animationData.isReversed) {
          animationData.frame--;
        } else {
          animationData.frame++;
        }
        if (animationData.frame > animationData.images.length - 1) {
          animationData.frame = 0;
        }
        if (animationData.frame < 0) {
          animationData.frame = animationData.images.length - 1;
        }
      }
      animation.mutate(animationData);
      viewport.drawImage({
        pose,
        image: animationData.images[animationData.frame],
      });
    });
  }
}
