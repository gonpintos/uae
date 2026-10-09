import type {
    RoomData
} from "./RoomData";

export class RoomAssetCollector {
    public collect(rooms: readonly RoomData[]): readonly string[] {
        const assetIds = new Set<string>();

        for (const room of rooms) {
            for (const visual of room.visuals) {
                if (visual.imageAssetId === undefined) {
                    continue;
                }

                const assetId = visual.imageAssetId.trim();

                if (!assetId) {
                    throw new Error(`Room "${room.id}", visual "${visual.id}", has an empty imageAssetId.`);
                }

                assetIds.add(assetId);
            }
        }

        return [...assetIds];
    }
}