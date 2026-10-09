import type { InventoryItemData } from "./InventoryItemData";

export class InventoryAssetCollector {
    public collect(items: readonly InventoryItemData[]): readonly string[] {
        const assetIds = new Set<string>();

        for (const item of items) {
            if (!item.icon) {
                continue;
            }

            const assetId = item.icon.assetId.trim();

            if (!assetId) {
                throw new Error(`Inventory item "${item.id}" has an empty icon asset id.`);
            }

            assetIds.add(assetId);
        }

        return [...assetIds];
    }
}
