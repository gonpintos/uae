import type { Renderer } from "../graphics/Renderer";
import type { HotspotCollection } from "../interaction/HotspotCollection";

export class HotspotDebugRenderer {
    public draw(
        renderer: Renderer,
        hotspots: HotspotCollection
    ): void {
        for (const hotspot of hotspots) {
            renderer.drawRectangle({
                x: hotspot.bounds.x,
                y: hotspot.bounds.y,
                width: hotspot.bounds.width,
                height: hotspot.bounds.height,

                fill: false,

                strokeColor: "#ffff00",
                strokeWidth: 2,
                strokeAlpha: 1
            });

            renderer.drawText({
                text: `[hotspot] ${hotspot.id}`,
                x: hotspot.bounds.x + 6,
                y: hotspot.bounds.y + 6,
                fontSize: 14,
                color: "#ffff00"
            });
        }
    }
}