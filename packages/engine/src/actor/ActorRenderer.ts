import type { AssetCatalog } from "../assets/AssetCatalog";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { ActorCollection } from "./ActorCollection";

export class ActorRenderer {
    public draw(
        renderer: Renderer,
        actors: ActorCollection,
        assets: AssetCatalog
    ): void {
        for (const actor of actors) {
            const layer = actor.layer ?? RenderLayer.RoomObject + 20;
            const frameAssetId = actor.currentFrameAssetId;

            if (frameAssetId) {
                renderer.drawImage({
                    source: assets.getSource(frameAssetId),
                    x: actor.x,
                    y: actor.y,
                    width: actor.width,
                    height: actor.height,
                    flipHorizontal: actor.flipHorizontal,
                    layer
                });
                continue;
            }

            renderer.drawRectangle({
                x: actor.x,
                y: actor.y,
                width: actor.width,
                height: actor.height,
                color: actor.color,
                alpha: 1,
                layer
            });

            renderer.drawText({
                text: actor.name,
                x: actor.x + 10,
                y: actor.y + 10,
                fontSize: 17,
                color: "#ffffff",
                layer: layer + 1
            });
        }
    }
}
