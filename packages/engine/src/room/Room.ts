import { Hotspot } from "../interaction/Hotspot";
import { HotspotCollection } from "../interaction/HotspotCollection";
import type { RoomData } from "./RoomData";
import type { RoomVisualData } from "./RoomVisualData";

export class Room {
    public readonly id: string;

    public readonly name: string;

    public readonly visuals: readonly RoomVisualData[];

    public readonly hotspots: HotspotCollection;

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
    }
}