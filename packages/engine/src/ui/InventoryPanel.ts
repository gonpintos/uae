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
        const gap = 8;

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

        const itemSize = this.itemHeight;
        const columns = Math.max(
            1,
            Math.floor((itemAreaWidth + gap) / (itemSize + gap))
        );

        for (const [index, item] of items.entries()) {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const itemBounds: Rectangle = {
                x: itemAreaX + column * (itemSize + gap),
                y: bounds.y + this.padding + row * (itemSize + gap),
                width: itemSize,
                height: itemSize
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

            if (item.icon && assets) {
                const iconY = itemBounds.y +
                    (itemBounds.height - item.icon.height) / 2;
                const iconX = itemBounds.x +
                    (itemBounds.width - item.icon.width) / 2;

                renderer.drawImage({
                    source: assets.getSource(item.icon.assetId),
                    x: iconX,
                    y: iconY,
                    width: item.icon.width,
                    height: item.icon.height,
                    layer: this.layer + 2
                });
            }
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
        const itemAreaWidth = this.width - this.padding * 2;
        const columns = Math.max(
            1,
            Math.floor((itemAreaWidth + 8) / (this.itemHeight + 8))
        );
        const rows = Math.max(1, Math.ceil(itemCount / columns));

        return {
            x: rendererSize.width - this.width - 20,
            y: 20,
            width: this.width,
            height: this.padding * 2 +
                rows * this.itemHeight +
                Math.max(0, rows - 1) * 8
        };
    }
}
