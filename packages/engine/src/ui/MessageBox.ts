import type { Renderer } from "../graphics/Renderer";
import type { Rectangle } from "../interaction/Rectangle";

export interface MessageBoxOptions {
    padding?: number;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
}

export class MessageBox {
    private readonly padding: number;

    private readonly backgroundColor: string;

    private readonly textColor: string;

    private readonly fontSize: number;

    public constructor(options: MessageBoxOptions = {}) {
        this.padding = options.padding ?? 20;

        this.backgroundColor =
            options.backgroundColor ?? "#202020";

        this.textColor =
            options.textColor ?? "#ffffff";

        this.fontSize =
            options.fontSize ?? 18;
    }

    public draw(
        renderer: Renderer,
        bounds: Rectangle,
        message: string
    ): void {
        renderer.drawRectangle({
            ...bounds,
            color: this.backgroundColor,
            alpha: 1
        });

        renderer.drawText({
            text: message,
            x: bounds.x + this.padding,
            y: bounds.y + this.padding,
            fontSize: this.fontSize,
            color: this.textColor
        });
    }
}