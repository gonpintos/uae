import type { InventoryItemData } from "./InventoryItemData";

export class InventoryItemCatalog {
    private readonly items = new Map<string, InventoryItemData>();

    public constructor(items: readonly InventoryItemData[] = []) {
        for (const item of items) {
            if (this.items.has(item.id)) {
                throw new Error(`Duplicate inventory item id: ${item.id}`);
            }

            this.items.set(item.id, item);
        }
    }

    public getById(itemId: string): InventoryItemData {
        const item = this.items.get(itemId);

        if (!item) {
            throw new Error(`Inventory item not found: ${itemId}`);
        }

        return item;
    }
}
