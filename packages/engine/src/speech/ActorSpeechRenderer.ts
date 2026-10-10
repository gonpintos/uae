import type { ActorCollection } from "../actor/ActorCollection";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { ActorSpeech } from "./ActorSpeechController";

export interface ActorSpeechRendererOptions {
    fontSize?: number;
    lineHeight?: number;
    maxWidth?: number;
    screenPadding?: number;
    headGap?: number;
    color?: string;
    strokeColor?: string;
    strokeWidth?: number;
    layer?: number;
}

export class ActorSpeechRenderer {
    private readonly fontSize: number;

    private readonly lineHeight: number;

    private readonly maxWidth: number;

    private readonly screenPadding: number;

    private readonly headGap: number;

    private readonly color: string;

    private readonly strokeColor: string;

    private readonly strokeWidth: number;

    private readonly layer: number;

    public constructor(options: ActorSpeechRendererOptions = {}) {
        this.fontSize = options.fontSize ?? 20;
        this.lineHeight = options.lineHeight ?? 24;
        this.maxWidth = options.maxWidth ?? 320;
        this.screenPadding = options.screenPadding ?? 20;
        this.headGap = options.headGap ?? 12;
        this.color = options.color ?? "#fff3a6";
        this.strokeColor = options.strokeColor ?? "#000000";
        this.strokeWidth = options.strokeWidth ?? 4;
        this.layer = options.layer ?? RenderLayer.Speech;
    }

    public draw(
        renderer: Renderer,
        speech: ActorSpeech,
        actors: ActorCollection
    ): void {
        const actor = actors.getById(speech.actorId);
        const rendererSize = renderer.getSize();
        const wrappedText = this.wrapText(speech.text);
        const lines = wrappedText.split("\n");
        const estimatedWidth = Math.min(
            this.maxWidth,
            Math.max(...lines.map((line) => line.length)) *
                this.fontSize * 0.62
        );
        const halfWidth = estimatedWidth / 2;
        const minimumCenterX = this.screenPadding + halfWidth;
        const maximumCenterX =
            rendererSize.width - this.screenPadding - halfWidth;
        const centerX = Math.min(
            maximumCenterX,
            Math.max(minimumCenterX, actor.x)
        );
        const textHeight = lines.length * this.lineHeight;
        const actorHeadY = actor.y - actor.height;
        const textY = Math.min(
            rendererSize.height - this.screenPadding - textHeight,
            Math.max(
                this.screenPadding,
                actorHeadY - this.headGap - textHeight
            )
        );

        renderer.drawText({
            text: wrappedText,
            x: centerX,
            y: textY,
            fontSize: this.fontSize,
            lineHeight: this.lineHeight,
            color: actor.speechColor ?? this.color,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            fontWeight: "bold",
            align: "center",
            anchorX: 0.5,
            layer: this.layer
        });
    }

    private wrapText(text: string): string {
        const approximateCharacterWidth = this.fontSize * 0.62;
        const maximumCharacters = Math.max(
            1,
            Math.floor(this.maxWidth / approximateCharacterWidth)
        );
        const sourceLines = text.split("\n");
        const wrappedLines: string[] = [];

        for (const sourceLine of sourceLines) {
            const words = sourceLine.trim().split(/\s+/);
            let currentLine = "";

            for (const sourceWord of words) {
                const wordParts = this.splitLongWord(
                    sourceWord,
                    maximumCharacters
                );

                for (const word of wordParts) {
                    const candidate = currentLine
                        ? `${currentLine} ${word}`
                        : word;

                    if (candidate.length <= maximumCharacters) {
                        currentLine = candidate;
                        continue;
                    }

                    if (currentLine) {
                        wrappedLines.push(currentLine);
                    }

                    currentLine = word;
                }
            }

            if (currentLine) {
                wrappedLines.push(currentLine);
            }
        }

        return wrappedLines.join("\n");
    }

    private splitLongWord(
        word: string,
        maximumCharacters: number
    ): readonly string[] {
        if (word.length <= maximumCharacters) {
            return [word];
        }

        const parts: string[] = [];

        for (
            let offset = 0;
            offset < word.length;
            offset += maximumCharacters
        ) {
            parts.push(word.slice(offset, offset + maximumCharacters));
        }

        return parts;
    }
}
