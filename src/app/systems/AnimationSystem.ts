import { IComponentMaster, IEntity } from '@plasmastrapi/ecs';
import { getAbsolutePose } from '@plasmastrapi/geometry';
import AnimationComponent, { IAnimation } from '../components/AnimationComponent';
import { IViewport, RenderingSystem } from '@plasmastrapi/engine';

export default class AnimationSystem extends RenderingSystem {
  public draw({ viewport, components }: { viewport: IViewport<any>; components: IComponentMaster }): void {
    components.forEvery(AnimationComponent)((animationComponent) => {
      const now = Date.now();
      const pose = getAbsolutePose(animationComponent.$entity as IEntity);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const animation = animationComponent.copy() as IAnimation & { __tNextFrame?: number };
      if (animation.__tNextFrame === undefined) {
        animation.__tNextFrame = now + animation.durationMs;
      }
      if (!animation.isPaused && now >= animation.__tNextFrame) {
        animation.__tNextFrame = now + animation.durationMs;
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
