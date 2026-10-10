import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { PointerPosition } from "../input/InputManager";
import {
    containsPoint,
    type Rectangle
} from "../interaction/Rectangle";
import {
    defaultVerbs,
    type VerbData,
    type VerbId
} from "../verb/VerbData";

export interface VerbPanelOptions {
    verbs?: readonly VerbData[];
    width?: number;
    height?: number;
    layer?: number;
    columns?: number;
}

interface VerbBounds {
    verb: VerbId;
    bounds: Rectangle;
}

export class VerbPanel {
    private readonly verbs: readonly VerbData[];

    private readonly width: number;

    private readonly height: number;

    private readonly layer: number;

    private readonly columns: number;

    private verbBounds: VerbBounds[] = [];

    public constructor(options: VerbPanelOptions = {}) {
        this.verbs = options.verbs ?? defaultVerbs;
        this.width = options.width ?? 700;
        this.height = options.height ?? 76;
        this.layer = options.layer ?? RenderLayer.Interface;
        this.columns = Math.max(1, Math.floor(options.columns ?? 2));
    }

    public draw(
        renderer: Renderer,
        selectedVerb: VerbId,
        providedBounds?: Rectangle
    ): void {
        const bounds = providedBounds ?? this.getBounds(renderer);
        const padding = 10;
        const gap = 8;
        const columns = Math.min(this.columns, Math.max(1, this.verbs.length));
        const rows = Math.max(1, Math.ceil(this.verbs.length / columns));
        const buttonWidth = (
            bounds.width - padding * 2 - gap * (columns - 1)
        ) / columns;
        const buttonHeight = (
            bounds.height - padding * 2 - gap * (rows - 1)
        ) / rows;

        this.verbBounds = [];

        renderer.drawRectangle({
            ...bounds,
            color: "#18202a",
            alpha: 0.96,
            strokeColor: "#71859b",
            strokeWidth: 2,
            layer: this.layer
        });

        for (const [index, verb] of this.verbs.entries()) {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const buttonBounds: Rectangle = {
                x: bounds.x + padding + column * (buttonWidth + gap),
                y: bounds.y + padding + row * (buttonHeight + gap),
                width: buttonWidth,
                height: buttonHeight
            };

            this.verbBounds.push({
                verb: verb.id,
                bounds: buttonBounds
            });

            const isSelected = verb.id === selectedVerb;

            renderer.drawRectangle({
                ...buttonBounds,
                color: isSelected ? "#9b6b32" : "#304154",
                alpha: 1,
                strokeColor: isSelected ? "#ffd18b" : "#71859b",
                strokeWidth: 1,
                layer: this.layer + 1
            });

            renderer.drawText({
                text: verb.label,
                x: buttonBounds.x + buttonBounds.width / 2,
                y: buttonBounds.y + buttonBounds.height / 2,
                fontSize: 17,
                color: "#ffffff",
                fontWeight: isSelected ? "bold" : "normal",
                align: "center",
                anchorX: 0.5,
                anchorY: 0.5,
                layer: this.layer + 2
            });
        }
    }

    public findVerbAt(position: PointerPosition): VerbId | null {
        const match = this.verbBounds.find(
            (entry) => containsPoint(entry.bounds, position)
        );

        return match?.verb ?? null;
    }

    private getBounds(renderer: Renderer): Rectangle {
        const rendererSize = renderer.getSize();

        return {
            x: 20,
            y: rendererSize.height - 200,
            width: this.width,
            height: this.height
        };
    }
}
