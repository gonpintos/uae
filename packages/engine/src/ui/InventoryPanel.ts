import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { InventoryItemData } from "../inventory/InventoryItemData";
import type { Rectangle } from "../interaction/Rectangle";

export interface InventoryPanelOptions {
    width?: number;
    padding?: number;
    itemHeight?: number;
    layer?: number;
}

export class InventoryPanel {
    private readonly width: number;

    private readonly padding: number;

    private readonly itemHeight: number;

    private readonly layer: number;

    public constructor(options: InventoryPanelOptions = {}) {
        this.width = options.width ?? 250;
        this.padding = options.padding ?? 16;
        this.itemHeight = options.itemHeight ?? 28;
        this.layer = options.layer ?? RenderLayer.Interface;
    }

    public draw(
        renderer: Renderer,
        items: readonly InventoryItemData[]
    ): void {
        const bounds = this.getBounds(renderer, items.length);

        renderer.drawRectangle({
            ...bounds,
            color: "#17221b",
            alpha: 0.95,
            strokeColor: "#71947a",
            strokeWidth: 2,
            layer: this.layer
        });

        renderer.drawText({
            text: "Inventario",
            x: bounds.x + this.padding,
            y: bounds.y + 12,
            fontSize: 18,
            color: "#c9efd3",
            fontWeight: "bold",
            layer: this.layer + 1
        });

        const visibleItems = items.length > 0
            ? items.map((item) => item.name)
            : ["(vacío)"];

        for (const [index, itemName] of visibleItems.entries()) {
            renderer.drawText({
                text: `• ${itemName}`,
                x: bounds.x + this.padding,
                y: bounds.y + 44 + index * this.itemHeight,
                fontSize: 16,
                color: "#ffffff",
                layer: this.layer + 1
            });
        }
    }

    private getBounds(
        renderer: Renderer,
        itemCount: number
    ): Rectangle {
        const rendererSize = renderer.getSize();
        const visibleItemCount = Math.max(itemCount, 1);

        return {
            x: rendererSize.width - this.width - 20,
            y: 20,
            width: this.width,
            height: 60 + visibleItemCount * this.itemHeight
        };
    }
}
