import type { DialogueView } from "../dialogue/DialogueSession";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { PointerPosition } from "../input/InputManager";
import {
    containsPoint,
    type Rectangle
} from "../interaction/Rectangle";

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
        this.height = options.height ?? 300;
        this.padding = options.padding ?? 20;
        this.optionHeight = options.optionHeight ?? 38;
        this.optionGap = options.optionGap ?? 8;
        this.layer = options.layer ?? RenderLayer.Interface;
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
            alpha: 0.98,
            strokeColor: "#9d83c7",
            strokeWidth: 2,
            layer: this.layer
        });

        renderer.drawText({
            text: `Hablando con ${view.npc.name}`,
            x: bounds.x + this.padding,
            y: bounds.y + 16,
            fontSize: 20,
            color: "#d6c5f2",
            fontWeight: "bold",
            layer: this.layer + 2
        });

        let optionsY = bounds.y + 54;

        if (view.lastTurn) {
            renderer.drawText({
                text: `${view.player.name}: «${view.lastTurn.playerLine}»`,
                x: bounds.x + this.padding,
                y: bounds.y + 52,
                fontSize: 17,
                color: "#f1e9ff",
                layer: this.layer + 2
            });

            if (view.lastTurn.npcLine) {
                renderer.drawText({
                    text: `${view.npc.name}: «${view.lastTurn.npcLine}»`,
                    x: bounds.x + this.padding,
                    y: bounds.y + 80,
                    fontSize: 17,
                    color: "#ffe4a8",
                    layer: this.layer + 2
                });
            }

            optionsY = bounds.y + 118;
        }

        for (const [index, option] of view.options.entries()) {
            const optionBounds: Rectangle = {
                x: bounds.x + this.padding,
                y: optionsY + index * (this.optionHeight + this.optionGap),
                width: bounds.width - this.padding * 2,
                height: this.optionHeight
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
                y: optionBounds.y + 8,
                fontSize: 17,
                color: "#ffffff",
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
