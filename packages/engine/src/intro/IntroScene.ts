import type { Scene } from "../scene/Scene";
import type { SceneContext } from "../scene/SceneContext";
import type { IntroData, IntroScreenData } from "./IntroData";
import { IntroRenderer } from "./IntroRenderer";

export type IntroDelay = (durationMs: number) => Promise<void>;

const browserDelay: IntroDelay = (durationMs) =>
    new Promise((resolve) => {
        globalThis.setTimeout(resolve, durationMs);
    });

export class IntroScene implements Scene {
    private readonly data: IntroData;

    private readonly nextScene: () => Scene;

    private readonly delay: IntroDelay;

    private readonly introRenderer: IntroRenderer;

    private playbackId = 0;

    private screenIndex = -1;

    public constructor(
        data: IntroData,
        nextScene: () => Scene,
        delay: IntroDelay = browserDelay,
        introRenderer: IntroRenderer = new IntroRenderer()
    ) {
        this.validate(data);
        this.data = data;
        this.nextScene = nextScene;
        this.delay = delay;
        this.introRenderer = introRenderer;
    }

    public get currentScreenIndex(): number {
        return this.screenIndex;
    }

    public get currentScreen(): IntroScreenData | null {
        return this.data.screens[this.screenIndex] ?? null;
    }

    public enter(context: SceneContext): void {
        const playbackId = ++this.playbackId;

        void this.play(context, playbackId);
    }

    public exit(context: SceneContext): void {
        this.playbackId += 1;
        this.screenIndex = -1;
        context.renderer.clear();
    }

    private async play(
        context: SceneContext,
        playbackId: number
    ): Promise<void> {
        for (
            let index = 0;
            index < this.data.screens.length;
            index += 1
        ) {
            if (playbackId !== this.playbackId) {
                return;
            }

            this.screenIndex = index;
            const screen = this.data.screens[index];

            this.introRenderer.draw(
                context.renderer,
                context.assets,
                this.data,
                screen
            );

            await this.delay(screen.durationMs);
        }

        if (playbackId === this.playbackId) {
            context.sceneNavigator.changeScene(this.nextScene());
        }
    }

    private validate(data: IntroData): void {
        if (data.screens.length === 0) {
            throw new Error("An intro must contain at least one screen.");
        }

        for (const screen of data.screens) {
            if (
                !Number.isFinite(screen.durationMs) ||
                screen.durationMs <= 0
            ) {
                throw new Error("Intro screen duration must be positive.");
            }

            if (screen.type === "text" && !screen.text.trim()) {
                throw new Error("Intro text cannot be empty.");
            }

            if (screen.type === "image" && !screen.assetId.trim()) {
                throw new Error("Intro image asset id cannot be empty.");
            }

            if (
                screen.type === "image" &&
                screen.aspectRatio !== undefined &&
                (!Number.isFinite(screen.aspectRatio) ||
                    screen.aspectRatio <= 0)
            ) {
                throw new Error("Intro image aspect ratio must be positive.");
            }
        }
    }
}
