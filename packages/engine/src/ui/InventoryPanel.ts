import type { AssetCatalog } from "../assets/AssetCatalog";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { PointerPosition } from "../input/InputManager";
import type { InventoryItemData } from "../inventory/InventoryItemData";
import {
    containsPoint,
    type Rectangle
} from "../interaction/Rectangle";

export interface InventoryPanelOptions {
    width?: number;
    padding?: number;
    itemHeight?: number;
    layer?: number;
}

interface InventoryItemBounds {
    itemId: string;
    bounds: Rectangle;
}

export class InventoryPanel {
    private readonly width: number;

    private readonly padding: number;

    private readonly itemHeight: number;

    private readonly layer: number;

    private itemBounds: InventoryItemBounds[] = [];

    public constructor(options: InventoryPanelOptions = {}) {
        this.width = options.width ?? 250;
        this.padding = options.padding ?? 16;
        this.itemHeight = options.itemHeight ?? 68;
        this.layer = options.layer ?? RenderLayer.Interface;
    }

    public draw(
        renderer: Renderer,
        items: readonly InventoryItemData[],
        assets?: AssetCatalog
    ): void {
        const bounds = this.getBounds(renderer, items.length);

        this.itemBounds = [];

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

        if (items.length === 0) {
            renderer.drawText({
                text: "(vacío)",
                x: bounds.x + this.padding,
                y: bounds.y + 44,
                fontSize: 16,
                color: "#ffffff",
                layer: this.layer + 1
            });

            return;
        }

        for (const [index, item] of items.entries()) {
            const itemBounds: Rectangle = {
                x: bounds.x + this.padding,
                y: bounds.y + 40 + index * this.itemHeight,
                width: bounds.width - this.padding * 2,
                height: this.itemHeight - 4
            };

            this.itemBounds.push({
                itemId: item.id,
                bounds: itemBounds
            });

            renderer.drawRectangle({
                ...itemBounds,
                color: "#29382e",
                alpha: 1,
                layer: this.layer + 1
            });

            let textX = itemBounds.x + 6;

            if (item.icon && assets) {
                const iconY = itemBounds.y +
                    (itemBounds.height - item.icon.height) / 2;

                renderer.drawImage({
                    source: assets.getSource(item.icon.assetId),
                    x: itemBounds.x + 8,
                    y: iconY,
                    width: item.icon.width,
                    height: item.icon.height,
                    layer: this.layer + 2
                });

                textX += item.icon.width + 12;
            }

            renderer.drawText({
                text: item.icon && assets ? item.name : `• ${item.name}`,
                x: textX,
                y: itemBounds.y + (itemBounds.height - 16) / 2,
                fontSize: 16,
                color: "#ffffff",
                layer: this.layer + 2
            });
        }
    }

    public findItemAt(position: PointerPosition): string | null {
        const match = this.itemBounds.find(
            (entry) => containsPoint(entry.bounds, position)
        );

        return match?.itemId ?? null;
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
