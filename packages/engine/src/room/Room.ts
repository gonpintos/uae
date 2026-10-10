import { Hotspot } from "../interaction/Hotspot";
import { HotspotCollection } from "../interaction/HotspotCollection";
import {
    containsWalkablePoint,
    type WalkableArea
} from "../interaction/WalkableArea";
import type { Point } from "../math/Point";
import type { RoomData } from "./RoomData";
import type { RoomVisualData } from "./RoomVisualData";

export class Room {
    public readonly id: string;

    public readonly name: string;

    public readonly visuals: readonly RoomVisualData[];

    public readonly hotspots: HotspotCollection;

    public readonly walkableArea: WalkableArea | null;

    public constructor(data: RoomData) {
        this.id = data.id;
        this.name = data.name;

        this.visuals = [
            ...data.visuals
        ];

        this.hotspots = new HotspotCollection(
            data.hotspots.map(
                (hotspotData) => new Hotspot(hotspotData)
            )
        );

        this.walkableArea = data.walkableArea
            ? data.walkableArea.type === "polygon"
                ? {
                    type: "polygon",
                    points: data.walkableArea.points.map((point) => ({...point}))
                }
                : {...data.walkableArea}
            : null;
    }

    public canWalkTo(position: Point): boolean {
        return this.walkableArea !== null &&
            containsWalkablePoint(this.walkableArea, position);
    }
}
