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
        assets?: AssetCatalog,
        providedBounds?: Rectangle
    ): void {
        const bounds = providedBounds ?? this.getBounds(renderer, items.length);
        const isEmbedded = providedBounds !== undefined;

        this.itemBounds = [];

        renderer.drawRectangle({
            ...bounds,
            color: "#17221b",
            alpha: 0.95,
            strokeColor: "#71947a",
            strokeWidth: 2,
            layer: this.layer
        });

        const itemAreaX = bounds.x + this.padding;
        const itemAreaWidth = Math.max(0, bounds.width - this.padding * 2);

        if (items.length === 0) {
            return;
        }

        const itemWidth = Math.min(
            180,
            Math.max(80, itemAreaWidth / items.length - 6)
        );

        for (const [index, item] of items.entries()) {
            const itemBounds: Rectangle = {
                x: isEmbedded
                    ? itemAreaX + index * (itemWidth + 6)
                    : itemAreaX,
                y: isEmbedded
                    ? bounds.y + 6
                    : bounds.y + this.padding + index * this.itemHeight,
                width: isEmbedded
                    ? itemWidth
                    : bounds.width - this.padding * 2,
                height: isEmbedded
                    ? bounds.height - 12
                    : this.itemHeight - 4
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
                y: isEmbedded
                    ? itemBounds.y + itemBounds.height / 2
                    : itemBounds.y + (itemBounds.height - 16) / 2,
                fontSize: 16,
                color: "#ffffff",
                anchorY: isEmbedded ? 0.5 : undefined,
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
            height: this.padding * 2 + visibleItemCount * this.itemHeight
        };
    }
}
