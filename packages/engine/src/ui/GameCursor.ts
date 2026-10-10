import { RenderLayer } from "../graphics/RenderLayer";
import type { RectangleOptions, Renderer } from "../graphics/Renderer";
import type { Point } from "../math/Point";

export interface GameCursorOptions {
    size?: number;
    armThickness?: number;
    centerGapSize?: number;
    colors?: readonly string[];
    stepDurationMs?: number;
    layer?: number;
    clock?: GameCursorClock;
    scheduler?: GameCursorScheduler;
}

export type GameCursorClock = () => number;

export type GameCursorScheduler = (
    callback: () => void,
    intervalMs: number
) => () => void;

const DEFAULT_COLORS = [
    "#ffffff",
    "#c8c8c8",
    "#777777",
    "#181818",
    "#777777",
    "#c8c8c8",
    "#ffffff"
] as const;

const DEFAULT_STEP_DURATION_MS = 110;

const defaultScheduler: GameCursorScheduler = (callback, intervalMs) => {
    const interval = globalThis.setInterval(callback, intervalMs);

    return () => {
        globalThis.clearInterval(interval);
    };
};

export class GameCursor {
    public readonly size: number;

    public readonly hotspotOffset: number;

    public readonly colors: readonly string[];

    public readonly stepDurationMs: number;

    private readonly armThickness: number;

    private readonly centerGapSize: number;

    private readonly armLength: number;

    private readonly layer: number;

    private readonly clock: GameCursorClock;

    private readonly scheduler: GameCursorScheduler;

    private animationStartedAtMs: number;

    public constructor(options: GameCursorOptions = {}) {
        this.size = options.size ?? 25;
        this.armThickness = options.armThickness ?? 3;
        this.centerGapSize = options.centerGapSize ?? 7;
        this.colors = options.colors ?? DEFAULT_COLORS;
        this.stepDurationMs = options.stepDurationMs ?? DEFAULT_STEP_DURATION_MS;
        this.layer = options.layer ?? RenderLayer.Cursor;
        this.clock = options.clock ?? Date.now;
        this.scheduler = options.scheduler ?? defaultScheduler;

        this.assertOddPositiveInteger(this.size, "size");
        this.assertOddPositiveInteger(this.armThickness, "armThickness");
        this.assertOddPositiveInteger(this.centerGapSize, "centerGapSize");

        if (this.centerGapSize >= this.size) {
            throw new Error("GameCursor centerGapSize must be smaller than its size.");
        }

        if (this.armThickness > this.centerGapSize) {
            throw new Error("GameCursor armThickness must fit inside its center gap.");
        }

        if (this.colors.length === 0) {
            throw new Error("GameCursor requires at least one animation color.");
        }

        if (!Number.isFinite(this.stepDurationMs) || this.stepDurationMs <= 0) {
            throw new Error("GameCursor stepDurationMs must be greater than zero.");
        }

        this.hotspotOffset = Math.floor(this.size / 2);
        this.armLength = (this.size - this.centerGapSize) / 2;
        this.animationStartedAtMs = this.clock();
    }

    public get currentColor(): string {
        const elapsed = Math.max(0, this.clock() - this.animationStartedAtMs);
        const colorIndex = Math.floor(elapsed / this.stepDurationMs) % this.colors.length;

        return this.colors[colorIndex] ?? this.colors[0]!;
    }

    public startAnimation(onFrame: () => void): () => void {
        this.animationStartedAtMs = this.clock();

        return this.scheduler(onFrame, this.stepDurationMs);
    }

    public draw(renderer: Renderer, position: Point): void {
        const centerX = Math.round(position.x);
        const centerY = Math.round(position.y);
        const halfThickness = Math.floor(this.armThickness / 2);
        const halfGap = Math.floor(this.centerGapSize / 2);
        const color = this.currentColor;

        const rectangles: RectangleOptions[] = [
            {
                x: centerX - halfThickness,
                y: centerY - this.hotspotOffset,
                width: this.armThickness,
                height: this.armLength,
                color
            },
            {
                x: centerX - halfThickness,
                y: centerY + halfGap + 1,
                width: this.armThickness,
                height: this.armLength,
                color
            },
            {
                x: centerX - this.hotspotOffset,
                y: centerY - halfThickness,
                width: this.armLength,
                height: this.armThickness,
                color
            },
            {
                x: centerX + halfGap + 1,
                y: centerY - halfThickness,
                width: this.armLength,
                height: this.armThickness,
                color
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
