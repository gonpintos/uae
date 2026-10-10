import { AssetCatalog } from "../../../packages/engine/src/assets/AssetCatalog";
import type {
    ImageOptions,
    RectangleOptions,
    Renderer,
    TextOptions
} from "../../../packages/engine/src/graphics/Renderer";
import { IntroAssetCollector } from "../../../packages/engine/src/intro/IntroAssetCollector";
import { IntroScene } from "../../../packages/engine/src/intro/IntroScene";
import type { Scene } from "../../../packages/engine/src/scene/Scene";
import type { SceneContext } from "../../../packages/engine/src/scene/SceneContext";
import { demoAssets } from "../src/assets/demoAssets";
import { demoIntroData } from "../src/data/demoIntroData";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(
            `${message}: expected ${String(expected)}, got ${String(actual)}`
        );
    }
}

async function flushPlayback(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

async function runTest(): Promise<void> {
    assertEqual(
        demoIntroData.screens.map((screen) => screen.type).join(","),
        "text,image,text",
        "The intro screens should keep their declared order"
    );
    assertEqual(
        demoIntroData.screens.map((screen) => screen.durationMs).join(","),
        "2200,5000,2500",
        "The intro should use the declared timings"
    );

    const introAssetIds = new IntroAssetCollector().collect(demoIntroData);
    const assets = new AssetCatalog(demoAssets);

    assertEqual(
        introAssetIds.join(","),
        "intro-presentation",
        "The intro image should be collected for preloading"
    );
    assertEqual(
        assets.getSource("intro-presentation"),
        "./assets/intro/intro-presentacion.png",
        "The intro image should use the final PNG path"
    );

    const screenEvents: string[] = [];
    const drawnImages: ImageOptions[] = [];
    const pendingDelays: Array<() => void> = [];
    const durations: number[] = [];
    let changedScene: Scene | null = null;
    const renderer = {
        getSize: () => ({width: 1280, height: 720}),
        clear: () => undefined,
        drawRectangle: (_options: RectangleOptions) => undefined,
        drawText: (options: TextOptions) => {
            if (
                options.text === "COPENHAGUE\n1999" ||
                options.text === "LOS ANTEOJOS DE FRANCO"
            ) {
                screenEvents.push(`text:${options.text}`);
            } else if (options.text.includes("Tres jóvenes argentinos.")) {
                screenEvents.push("caption");
            }
        },
        drawImage: (options: ImageOptions) => {
            drawnImages.push(options);
            screenEvents.push("image");
        }
    } as unknown as Renderer;
    const context = {
        renderer,
        assets,
        sceneNavigator: {
            changeScene: (scene: Scene) => {
                changedScene = scene;
            }
        }
    } as unknown as SceneContext;
    const gameScene = {
        enter: () => undefined,
        exit: () => undefined
    } satisfies Scene;
    const intro = new IntroScene(
        demoIntroData,
        () => gameScene,
        (durationMs) => {
            durations.push(durationMs);

            return new Promise((resolve) => {
                pendingDelays.push(resolve);
            });
        }
    );

    assert(
        intro instanceof IntroScene,
        "The demo intro configuration should create an IntroScene"
    );

    intro.enter(context);

    assertEqual(
        intro.currentScreenIndex,
        0,
        "The intro should begin on the first screen"
    );
    assertEqual(
        screenEvents.join("|"),
        "text:COPENHAGUE\n1999",
        "The opening plate should be drawn first"
    );

    pendingDelays.shift()?.();
    await flushPlayback();

    assertEqual(
        intro.currentScreenIndex,
        1,
        "The image screen should follow the opening plate"
    );
    assertEqual(
        screenEvents.join("|"),
        "text:COPENHAGUE\n1999|image|caption",
        "The image and narrative caption should be drawn together"
    );
    assertEqual(
        drawnImages[0]?.source,
        "./assets/intro/intro-presentacion.png",
        "IntroScene should resolve the loaded image through AssetCatalog"
    );

    pendingDelays.shift()?.();
    await flushPlayback();

    assertEqual(
        intro.currentScreenIndex,
        2,
        "The title plate should be the final intro screen"
    );
    assert(
        screenEvents.at(-1) === "text:LOS ANTEOJOS DE FRANCO",
        "The game title should be drawn last"
    );
    assert(
        changedScene === null,
        "The game scene should not open before the final duration ends"
    );

    pendingDelays.shift()?.();
    await flushPlayback();

    assert(
        changedScene === gameScene,
        "The intro should open the declared game scene when it finishes"
    );
    assertEqual(
        durations.join(","),
        "2200,5000,2500",
        "Playback should wait once for every declared screen"
    );

    console.log("Intro functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
