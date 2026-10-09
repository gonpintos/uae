import type { Scene } from "./Scene";
import type { SceneContext } from "./SceneContext";

export class DiagnosticScene implements Scene {
    private readonly nextScene: () => Scene;

    private unsubscribePointerDown: (() => void) | null = null;

    public constructor(nextScene: () => Scene) {
        this.nextScene = nextScene;
    }

    public enter(context: SceneContext): void {
        context.renderer.drawText({
            text: "Ultrasoft Adventure Engine",
            x: 40,
            y: 40,
            fontSize: 32,
            fontWeight: "bold"
        });

        context.renderer.drawText({
            text: "Renderer online",
            x: 40,
            y: 90,
            fontSize: 18,
            color: "#a0a0a0"
        });

        context.renderer.drawText({
            text: "Click to continue",
            x: 40,
            y: 140,
            fontSize: 16,
            color: "#a0a0a0"
        });

        this.unsubscribePointerDown =
            context.input.onPointerDown(() => {
                context.sceneNavigator.changeScene(
                    this.nextScene()
                );
            });
    }

    public exit(context: SceneContext): void {
        this.unsubscribePointerDown?.();
        this.unsubscribePointerDown = null;

        context.renderer.clear();
    }
}