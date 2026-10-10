import type { ActorCollection } from "../actor/ActorCollection";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { Point } from "../math/Point";
import type { Room } from "../room/Room";

export interface NavigationDebugRendererOptions {
    layer?: number;
}

export class NavigationDebugRenderer {
    private readonly layer: number;

    public constructor(options: NavigationDebugRendererOptions = {}) {
        this.layer = options.layer ?? RenderLayer.Debug;
    }

    public draw(
        renderer: Renderer,
        room: Room,
        actors: ActorCollection,
        controlledActorId: string
    ): void {
        this.drawWalkableArea(renderer, room);

        const actor = actors.getById(controlledActorId);

        this.drawMarker(renderer, {x: actor.x, y: actor.y}, "#00ffff", 8);
        renderer.drawText({
            text: `[anchor] ${actor.id}`,
            x: actor.x + 10,
            y: actor.y - 18,
            fontSize: 12,
            color: "#00ffff",
            layer: this.layer
        });

        for (const hotspot of room.hotspots) {
            if (!hotspot.interactionPosition) {
                continue;
            }

            this.drawMarker(
                renderer,
                hotspot.interactionPosition,
                "#ff66ff",
                6
            );
            renderer.drawText({
                text: `[interaction] ${hotspot.id}`,
                x: hotspot.interactionPosition.x + 8,
                y: hotspot.interactionPosition.y - 16,
                fontSize: 12,
                color: "#ff66ff",
                layer: this.layer
            });
        }

        for (const visual of room.visuals) {
            if (visual.depthY === undefined) {
                continue;
            }

            renderer.drawLine({
                from: {x: visual.x, y: visual.depthY},
                to: {x: visual.x + visual.width, y: visual.depthY},
                color: "#ff9f1c",
                width: 2,
                layer: this.layer
            });
            renderer.drawText({
                text: `[depthY ${visual.depthY}] ${visual.id}`,
                x: visual.x + 6,
                y: visual.depthY - 18,
                fontSize: 12,
                color: "#ff9f1c",
                layer: this.layer
            });
        }
    }

    private drawWalkableArea(renderer: Renderer, room: Room): void {
        const area = room.walkableArea;

        if (!area) {
            return;
        }

        const points = area.type === "polygon"
            ? area.points
            : [
                {x: area.x, y: area.y},
                {x: area.x + area.width, y: area.y},
                {x: area.x + area.width, y: area.y + area.height},
                {x: area.x, y: area.y + area.height}
            ];

        for (let index = 0; index < points.length; index += 1) {
            const from = points[index];
            const to = points[(index + 1) % points.length];

            if (!from || !to) {
                continue;
            }

            renderer.drawLine({
                from,
                to,
                color: "#54ff54",
                width: 2,
                layer: this.layer
            });
        }
    }

    private drawMarker(
        renderer: Renderer,
        position: Point,
        color: string,
        radius: number
    ): void {
        renderer.drawLine({
            from: {x: position.x - radius, y: position.y},
            to: {x: position.x + radius, y: position.y},
            color,
            width: 2,
            layer: this.layer
        });
        renderer.drawLine({
            from: {x: position.x, y: position.y - radius},
            to: {x: position.x, y: position.y + radius},
            color,
            width: 2,
            layer: this.layer
        });
    }
}
