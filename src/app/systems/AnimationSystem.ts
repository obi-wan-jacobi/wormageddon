import { IComponentMaster, IEntity } from '@plasmastrapi/ecs';
import AnimationComponent from '../components/AnimationComponent';
import { RenderingSystem } from '@plasmastrapi/engine';
import { getAbsolutePose } from '@plasmastrapi/helpers';
import { IViewport } from '@plasmastrapi/viewport';

export default class AnimationSystem extends RenderingSystem {
  public draw({ viewport, components }: { viewport: IViewport<any>; components: IComponentMaster }): void {
    components.forEvery(AnimationComponent)((animationComponent) => {
      const now = Date.now();
      const pose = getAbsolutePose(animationComponent.$entity as IEntity);
      const animation = animationComponent.copy();
      if (animation.$ === undefined) {
        animation.$ = { tNextFrame: now + animation.durationMs };
      }
      if (!animation.isPaused && now >= animation.$.tNextFrame) {
        animation.$.tNextFrame = now + animation.durationMs;
        if (animation.isReversed) {
          animation.frame--;
        } else {
          animation.frame++;
        }
        if (animation.frame > animation.images.length - 1) {
          if (animation.isRollback) {
            animation.isReversed = true;
            animation.frame = animation.images.length - 1;
          } else {
            animation.frame = 0;
          }
        }
        if (animation.frame < 0) {
          if (animation.isRollback) {
            animation.isReversed = false;
            animation.frame = 0;
          } else {
            animation.frame = animation.images.length - 1;
          }
        }
      }
      animationComponent.mutate(animation);
      viewport.drawImage({
        pose,
        image: animation.images[animation.frame],
      });
    });
  }
}
