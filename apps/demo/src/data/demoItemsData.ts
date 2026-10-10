import type { InventoryItemData } from "@uae/engine";

export const demoItemsData: readonly InventoryItemData[] = [
    {
        id: "calculator",
        name: "Calculadora",
        description: "¡La mágica!",
        defaultVerb: "use",
        icon: {
            assetId: "calculator-icon",
            width: 32,
            height: 48
        }
    }
];
