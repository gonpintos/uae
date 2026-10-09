import type { InventoryItemCatalog } from "./InventoryItemCatalog";
import type { InventoryItemData } from "./InventoryItemData";

export class Inventory {
    private readonly catalog: InventoryItemCatalog;

    private readonly ownedItemIds = new Set<string>();

    public constructor(
        catalog: InventoryItemCatalog,
        initialItemIds: readonly string[] = []
    ) {
        this.catalog = catalog;

        for (const itemId of initialItemIds) {
            this.add(itemId);
        }
    }

    public get items(): readonly InventoryItemData[] {
        return [...this.ownedItemIds].map(
            (itemId) => this.catalog.getById(itemId)
        );
    }

    public add(itemId: string): void {
        this.catalog.getById(itemId);
        this.ownedItemIds.add(itemId);
    }

    public has(itemId: string): boolean {
        this.catalog.getById(itemId);
        return this.ownedItemIds.has(itemId);
    }
}
