import type { PointerPosition } from "../input/InputManager";
import type { Hotspot } from "./Hotspot";

export class HotspotCollection implements Iterable<Hotspot> {
    private readonly hotspots: Hotspot[];

    public constructor(hotspots: Hotspot[]) {
        this.hotspots = hotspots;
    }

    public findAt(position: PointerPosition): Hotspot | null {
        const hotspot = this.hotspots.find((currentHotspot) =>
            currentHotspot.contains(position)
        );

        return hotspot ?? null;
    }

    public [Symbol.iterator](): Iterator<Hotspot> {
        return this.hotspots[Symbol.iterator]();
    }
}