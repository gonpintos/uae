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

export type InventoryScrollDirection = "previous" | "next";

interface InventoryScrollBounds {
    direction: InventoryScrollDirection;
    bounds: Rectangle;
}

export class InventoryPanel {
    private readonly width: number;

    private readonly padding: number;

    private readonly itemHeight: number;

    private readonly layer: number;

    private itemBounds: InventoryItemBounds[] = [];

    private scrollBounds: InventoryScrollBounds[] = [];

    private currentPage = 0;

    private currentPageCount = 1;

    private visibleIds: string[] = [];

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
        this.scrollBounds = [];
        this.visibleIds = [];

        renderer.drawRectangle({
            ...bounds,
            color: "#17221b",
            alpha: 0.95,
            strokeColor: "#71947a",
            strokeWidth: 2,
            layer: this.layer
        });

        if (items.length === 0) {
            this.currentPage = 0;
            this.currentPageCount = 1;
            return;
        }

        const itemSize = this.itemHeight;
        const itemAreaHeight = Math.max(0, bounds.height - this.padding * 2);
        const rows = Math.max(
            1,
            Math.floor((itemAreaHeight + gap) / (itemSize + gap))
        );
        const baseItemAreaWidth = Math.max(
            0,
            bounds.width - this.padding * 2
        );
        const baseColumns = this.getColumnCount(
            baseItemAreaWidth,
            itemSize,
            gap
        );
        const hasOverflow = items.length > baseColumns * rows;
        const scrollWidth = hasOverflow ? 32 : 0;
        const itemAreaX = bounds.x + this.padding + scrollWidth;
        const itemAreaWidth = Math.max(
            0,
            baseItemAreaWidth - scrollWidth * 2
        );
        const columns = this.getColumnCount(itemAreaWidth, itemSize, gap);
        const pageSize = Math.max(1, columns * rows);

        this.currentPageCount = Math.max(1, Math.ceil(items.length / pageSize));
        this.currentPage = Math.min(
            this.currentPage,
            this.currentPageCount - 1
        );

        if (hasOverflow) {
            this.drawScrollControls(renderer, bounds, scrollWidth);
        }

        const firstVisibleIndex = this.currentPage * pageSize;
        const visibleItems = items.slice(
            firstVisibleIndex,
            firstVisibleIndex + pageSize
        );

        this.visibleIds = visibleItems.map((item) => item.id);

        for (const [index, item] of visibleItems.entries()) {
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

    public findScrollAt(
        position: PointerPosition
    ): InventoryScrollDirection | null {
        return this.scrollBounds.find(
            (entry) => containsPoint(entry.bounds, position)
        )?.direction ?? null;
    }

    public scroll(direction: InventoryScrollDirection): boolean {
        const nextPage = direction === "next"
            ? Math.min(this.currentPage + 1, this.currentPageCount - 1)
            : Math.max(this.currentPage - 1, 0);

        if (nextPage === this.currentPage) {
            return false;
        }

        this.currentPage = nextPage;
        return true;
    }

    public get pageIndex(): number {
        return this.currentPage;
    }

    public get pageCount(): number {
        return this.currentPageCount;
    }

    public get visibleItemIds(): readonly string[] {
        return this.visibleIds;
    }

    private getColumnCount(
        width: number,
        itemSize: number,
        gap: number
    ): number {
        return Math.max(
            1,
            Math.floor((width + gap) / (itemSize + gap))
        );
    }

    private drawScrollControls(
        renderer: Renderer,
        bounds: Rectangle,
        width: number
    ): void {
        const buttonHeight = 54;
        const buttonY = bounds.y + (bounds.height - buttonHeight) / 2;
        const previousBounds: Rectangle = {
            x: bounds.x + this.padding,
            y: buttonY,
            width: width - 4,
            height: buttonHeight
        };
        const nextBounds: Rectangle = {
            x: bounds.x + bounds.width - this.padding - width + 4,
            y: buttonY,
            width: width - 4,
            height: buttonHeight
        };

        this.scrollBounds = [
            {direction: "previous", bounds: previousBounds},
            {direction: "next", bounds: nextBounds}
        ];

        for (const control of this.scrollBounds) {
            const enabled = control.direction === "previous"
                ? this.currentPage > 0
                : this.currentPage < this.currentPageCount - 1;

            renderer.drawRectangle({
                ...control.bounds,
                color: enabled ? "#304154" : "#20262d",
                alpha: 1,
                strokeColor: enabled ? "#71859b" : "#3d4650",
                strokeWidth: 1,
                layer: this.layer + 1
            });
            renderer.drawText({
                text: control.direction === "previous" ? "◀" : "▶",
                x: control.bounds.x + control.bounds.width / 2,
                y: control.bounds.y + control.bounds.height / 2,
                fontSize: 18,
                color: enabled ? "#ffffff" : "#69727c",
                anchorX: 0.5,
                anchorY: 0.5,
                layer: this.layer + 2
            });
        }
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
