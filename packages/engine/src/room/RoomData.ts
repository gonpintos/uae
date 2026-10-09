import type { HotspotOptions } from "../interaction/Hotspot";

import type { RoomVisualData } from "./RoomVisualData";

export interface RoomData {
    id: string;
    name: string;

    visuals: RoomVisualData[];

    hotspots: HotspotOptions[];
}