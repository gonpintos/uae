import type { DefaultVerb } from "../interaction/DefaultVerb";

export interface InventoryItemIconData {
    assetId: string;
    width: number;
    height: number;
}

export interface InventoryItemData {
    id: string;
    name: string;
    description?: string;
    icon?: InventoryItemIconData;
    defaultVerb?: DefaultVerb;
}
