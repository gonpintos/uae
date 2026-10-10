import type { HotspotOptions } from "../interaction/Hotspot";
import type { WalkableArea } from "../interaction/WalkableArea";

import type { RoomVisualData } from "./RoomVisualData";

export interface RoomData {
    id: string;
    name: string;

    visuals: RoomVisualData[];

    hotspots: HotspotOptions[];

    /** Allowed bounds for an actor's ground anchor. */
    walkableArea?: WalkableArea;
}
