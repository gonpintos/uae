import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { ActorCollection } from "./ActorCollection";

export class ActorRenderer {
    public draw(renderer: Renderer, actors: ActorCollection): void {
        for (const actor of actors) {
            renderer.drawRectangle({
                x: actor.x,
                y: actor.y,
                width: actor.width,
                height: actor.height,
                color: actor.color,
                alpha: 1,
                layer: RenderLayer.RoomObject + 20
            });

            renderer.drawText({
                text: actor.name,
                x: actor.x + 10,
                y: actor.y + 10,
                fontSize: 17,
                color: "#ffffff",
                layer: RenderLayer.RoomObject + 21
            });
        }
    }
}
