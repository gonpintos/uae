import type { AssetCatalog } from "../assets/AssetCatalog";
import type { EngineConfig } from "../config/EngineConfig";
import type { Renderer } from "../graphics/Renderer";
import type { InputManager } from "../input/InputManager";
import type { Inventory } from "../inventory/Inventory";
import type { GameState } from "../state/GameState";
import type { Scene } from "./Scene";
import type { SceneContext } from "./SceneContext";
import type { SceneNavigator } from "./SceneNavigator";

export class SceneManager implements SceneNavigator {
    private readonly context: SceneContext;

    private currentScene: Scene | null = null;

    public constructor(
        renderer: Renderer,
        input: InputManager,
        config: EngineConfig,
        assets: AssetCatalog,
        state: GameState,
        inventory: Inventory
    ) {
        this.context = {
            renderer,
            input,
            config,
            assets,
            state,
            inventory,
            sceneNavigator: this
        };
    }

    public changeScene(scene: Scene): void {
        this.currentScene?.exit(this.context);

        this.currentScene = scene;

        this.currentScene.enter(this.context);
    }
}
