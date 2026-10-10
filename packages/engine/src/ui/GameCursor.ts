import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { Point } from "../math/Point";

export interface GameCursorOptions {
    pixelSize?: number;
    layer?: number;
}

export class GameCursor {
    private readonly pixelSize: number;

    private readonly layer: number;

    public constructor(options: GameCursorOptions = {}) {
        this.pixelSize = options.pixelSize ?? 4;
        this.layer = options.layer ?? RenderLayer.Cursor;
    }

    public draw(renderer: Renderer, position: Point): void {
        const viewportScale = renderer.getViewportScale?.() ?? 1;
        const p = this.pixelSize / viewportScale;
        const rows = [
            "10000",
            "11000",
            "12100",
            "12210",
            "12221",
            "12110",
            "11010",
            "10011"
        ];

        for (const [rowIndex, row] of rows.entries()) {
            for (const [columnIndex, value] of [...row].entries()) {
                if (value === "0") {
                    continue;
                }

                renderer.drawRectangle({
                    x: position.x + columnIndex * p,
                    y: position.y + rowIndex * p,
                    width: p,
                    height: p,
                    color: value === "1" ? "#000000" : "#ffffff",
                    alpha: 1,
                    layer: this.layer
                });
            }
        }
    }
}
