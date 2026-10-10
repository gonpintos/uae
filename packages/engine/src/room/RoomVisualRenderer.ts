import type { AssetCatalog } from "../assets/AssetCatalog";
import type { Renderer } from "../graphics/Renderer";
import { getWorldDepthLayer } from "../graphics/WorldDepth";

import type { Room } from "./Room";

import { RenderLayer } from "../graphics/RenderLayer";

export class RoomVisualRenderer {
    public draw(renderer: Renderer,room: Room, assets: AssetCatalog): void {
        for (const visual of room.visuals) {
            
            const layer = visual.layer ?? (
                visual.depthY === undefined
                    ? RenderLayer.RoomObject
                    : getWorldDepthLayer(visual.depthY)
            );

            if (visual.imageAssetId) {
                renderer.drawImage({
                    source: assets.getSource(visual.imageAssetId),
                    x: visual.x,
                    y: visual.y,
                    width: visual.width,
                    height: visual.height,
                    alpha: visual.alpha ?? 1,
                    layer
                });
            } else {
                renderer.drawRectangle({
                    x: visual.x,
                    y: visual.y,
                    width: visual.width,
                    height: visual.height,
                    color: visual.color ?? "#444444",
                    alpha: visual.alpha ?? 1,
                    layer
                });
            }

            if (visual.label) {
                renderer.drawText({
                    text: visual.label,
                    x: visual.x + 12,
                    y: visual.y + 12,
                    fontSize: 18,
                    color: "#ffffff",
                    layer
                });
            }
        }
    }
}
