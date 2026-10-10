import type { AssetCatalog } from "../assets/AssetCatalog";
import type { Renderer } from "../graphics/Renderer";
import { getWorldDepthLayer } from "../graphics/WorldDepth";
import type { ActorCollection } from "./ActorCollection";

export class ActorRenderer {
    public draw(
        renderer: Renderer,
        actors: ActorCollection,
        assets: AssetCatalog
    ): void {
        for (const actor of actors) {
            const layer = actor.layer ?? getWorldDepthLayer(actor.y);
            const frameAssetId = actor.currentFrameAssetId;
            const renderX = actor.x - actor.width / 2;
            const renderY = actor.y - actor.height;

            if (frameAssetId) {
                renderer.drawImage({
                    source: assets.getSource(frameAssetId),
                    x: renderX,
                    y: renderY,
                    width: actor.width,
                    height: actor.height,
                    flipHorizontal: actor.flipHorizontal,
                    layer
                });
                continue;
            }

            renderer.drawRectangle({
                x: renderX,
                y: renderY,
                width: actor.width,
                height: actor.height,
                color: actor.color,
                alpha: 1,
                layer
            });

            renderer.drawText({
                text: actor.name,
                x: renderX + 10,
                y: renderY + 10,
                fontSize: 17,
                color: "#ffffff",
                layer
            });
        }
    }
}
