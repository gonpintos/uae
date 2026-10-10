import { RenderLayer } from "../graphics/RenderLayer";
import type { RectangleOptions, Renderer } from "../graphics/Renderer";
import type { Point } from "../math/Point";

export interface GameCursorOptions {
    size?: number;
    armWidth?: number;
    outlineWidth?: number;
    layer?: number;
}

export class GameCursor {
    public readonly size: number;

    public readonly hotspotOffset: number;

    private readonly armWidth: number;

    private readonly outlineWidth: number;

    private readonly layer: number;

    public constructor(options: GameCursorOptions = {}) {
        this.size = options.size ?? 25;
        this.armWidth = options.armWidth ?? 5;
        this.outlineWidth = options.outlineWidth ?? 1;
        this.layer = options.layer ?? RenderLayer.Cursor;

        this.assertOddPositiveInteger(this.size, "size");
        this.assertOddPositiveInteger(this.armWidth, "armWidth");

        if (
            !Number.isInteger(this.outlineWidth) ||
            this.outlineWidth < 1 ||
            this.outlineWidth * 2 >= this.armWidth ||
            this.armWidth > this.size
        ) {
            throw new Error("GameCursor requires an integer outline inside its arm width.");
        }

        this.hotspotOffset = Math.floor(this.size / 2);
    }

    public draw(renderer: Renderer, position: Point): void {
        const centerX = Math.round(position.x);
        const centerY = Math.round(position.y);
        const halfArmWidth = Math.floor(this.armWidth / 2);
        const outerStartX = centerX - this.hotspotOffset;
        const outerStartY = centerY - this.hotspotOffset;
        const armStartX = centerX - halfArmWidth;
        const armStartY = centerY - halfArmWidth;
        const innerSize = this.size - this.outlineWidth * 2;
        const innerArmWidth = this.armWidth - this.outlineWidth * 2;
        const innerHalfArmWidth = Math.floor(innerArmWidth / 2);
        const innerStartX = centerX - innerHalfArmWidth;
        const innerStartY = centerY - innerHalfArmWidth;

        const rectangles: RectangleOptions[] = [
            {
                x: outerStartX,
                y: armStartY,
                width: this.size,
                height: this.armWidth,
                color: "#000000"
            },
            {
                x: armStartX,
                y: outerStartY,
                width: this.armWidth,
                height: this.size,
                color: "#000000"
            },
            {
                x: centerX - Math.floor(innerSize / 2),
                y: innerStartY,
                width: innerSize,
                height: innerArmWidth,
                color: "#ffffff"
            },
            {
                x: innerStartX,
                y: centerY - Math.floor(innerSize / 2),
                width: innerArmWidth,
                height: innerSize,
                color: "#ffffff"
            }
        ];

        for (const rectangle of rectangles) {
            renderer.drawRectangle({
                ...rectangle,
                alpha: 1,
                layer: this.layer,
                pixelPerfect: true
            });
        }
    }

    private assertOddPositiveInteger(value: number, name: string): void {
        if (!Number.isInteger(value) || value < 1 || value % 2 === 0) {
            throw new Error(`GameCursor ${name} must be a positive odd integer.`);
        }
    }
}
