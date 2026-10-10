import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";

export interface ScreenTitleOptions {
    fontSize?: number;
    color?: string;
    strokeColor?: string;
    strokeWidth?: number;
    layer?: number;
}

export class ScreenTitle {
    private readonly options: Required<ScreenTitleOptions>;

    public constructor(options: ScreenTitleOptions = {}) {
        this.options = {
            fontSize: options.fontSize ?? 64,
            color: options.color ?? "#ffffff",
            strokeColor: options.strokeColor ?? "#000000",
            strokeWidth: options.strokeWidth ?? 6,
            layer: options.layer ?? RenderLayer.Modal
        };
    }

    public draw(renderer: Renderer, text: string): void {
        const size = renderer.getSize();

        renderer.drawText({
            text,
            x: size.width / 2,
            y: size.height / 2,
            fontSize: this.options.fontSize,
            color: this.options.color,
            strokeColor: this.options.strokeColor,
            strokeWidth: this.options.strokeWidth,
            fontWeight: "bold",
            align: "center",
            anchorX: 0.5,
            anchorY: 0.5,
            layer: this.options.layer
        });
    }
}
