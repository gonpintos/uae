import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { Rectangle } from "../interaction/Rectangle";
import {
    defaultVerbs,
    type VerbData,
    type VerbId
} from "../verb/VerbData";

export interface ActionLineOptions {
    verbs?: readonly VerbData[];
    layer?: number;
}

export class ActionLine {
    private readonly verbs: readonly VerbData[];

    private readonly layer: number;

    public constructor(options: ActionLineOptions = {}) {
        this.verbs = options.verbs ?? defaultVerbs;
        this.layer = options.layer ?? RenderLayer.Interface + 2;
    }

    public buildText(
        verbId: VerbId,
        targetName: string | null
    ): string {
        const verb = this.verbs.find((entry) => entry.id === verbId);
        const label = verb?.label ?? verbId;

        return targetName ? `${label} ${targetName}` : label;
    }

    public draw(
        renderer: Renderer,
        bounds: Rectangle,
        text: string
    ): void {
        renderer.drawText({
            text,
            x: bounds.x + 14,
            y: bounds.y + bounds.height / 2,
            fontSize: 20,
            color: "#fff1a8",
            fontWeight: "bold",
            anchorY: 0.5,
            layer: this.layer
        });
    }
}
