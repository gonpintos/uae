import type { DialogueView } from "../dialogue/DialogueSession";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { PointerPosition } from "../input/InputManager";
import {
    containsPoint,
    type Rectangle
} from "../interaction/Rectangle";
import { DEFAULT_INTERFACE_HEIGHT } from "./GameLayout";

export interface DialoguePanelOptions {
    height?: number;
    padding?: number;
    optionHeight?: number;
    optionGap?: number;
    layer?: number;
}

interface DialogueOptionBounds {
    optionId: string;
    bounds: Rectangle;
}

export class DialoguePanel {
    private readonly height: number;

    private readonly padding: number;

    private readonly optionHeight: number;

    private readonly optionGap: number;

    private readonly layer: number;

    private optionBounds: DialogueOptionBounds[] = [];

    public constructor(options: DialoguePanelOptions = {}) {
        this.height = options.height ?? DEFAULT_INTERFACE_HEIGHT;
        this.padding = options.padding ?? 12;
        this.optionHeight = options.optionHeight ?? 24;
        this.optionGap = options.optionGap ?? 2;
        this.layer = options.layer ?? RenderLayer.Modal;
    }

    public getBounds(renderer: Renderer): Rectangle {
        const rendererSize = renderer.getSize();

        return {
            x: 0,
            y: rendererSize.height - this.height,
            width: rendererSize.width,
            height: this.height
        };
    }

    public draw(
        renderer: Renderer,
        bounds: Rectangle,
        view: DialogueView
    ): void {
        this.optionBounds = [];

        renderer.drawRectangle({
            ...bounds,
            color: "#17131f",
            alpha: 1,
            strokeColor: "#9d83c7",
            strokeWidth: 2,
            layer: this.layer
        });

        renderer.drawText({
            text: `Hablando con ${view.npc.name}`,
            x: bounds.x + this.padding,
            y: bounds.y + 16,
            fontSize: 17,
            color: "#d6c5f2",
            fontWeight: "bold",
            anchorY: 0.5,
            layer: this.layer + 2
        });

        const optionsY = bounds.y + 32;
        const availableHeight = bounds.height - 38;
        const optionHeight = Math.min(
            this.optionHeight,
            Math.max(
                14,
                (availableHeight -
                    this.optionGap * Math.max(0, view.options.length - 1)) /
                    Math.max(1, view.options.length)
            )
        );

        for (const [index, option] of view.options.entries()) {
            const optionBounds: Rectangle = {
                x: bounds.x + this.padding,
                y: optionsY + index * (optionHeight + this.optionGap),
                width: bounds.width - this.padding * 2,
                height: optionHeight
            };

            this.optionBounds.push({
                optionId: option.id,
                bounds: optionBounds
            });

            renderer.drawRectangle({
                ...optionBounds,
                color: "#332947",
                alpha: 1,
                strokeColor: "#705c94",
                strokeWidth: 1,
                layer: this.layer + 1
            });

            renderer.drawText({
                text: `${index + 1}. ${option.playerLine}`,
                x: optionBounds.x + 12,
                y: optionBounds.y + optionBounds.height / 2,
                fontSize: 15,
                color: "#ffffff",
                anchorY: 0.5,
                layer: this.layer + 2
            });
        }
    }

    public findOptionAt(position: PointerPosition): string | null {
        const match = this.optionBounds.find(
            (option) => containsPoint(option.bounds, position)
        );

        return match?.optionId ?? null;
    }
}
