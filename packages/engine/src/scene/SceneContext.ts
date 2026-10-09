import type { AssetCatalog } from "../assets/AssetCatalog";
import type { EngineConfig } from "../config/EngineConfig";
import type { Renderer } from "../graphics/Renderer";
import type { InputManager } from "../input/InputManager";
import type { Inventory } from "../inventory/Inventory";
import type { GameState } from "../state/GameState";
import type { SceneNavigator } from "./SceneNavigator";

export interface SceneContext {
    renderer: Renderer;
    input: InputManager;
    sceneNavigator: SceneNavigator;
    config: EngineConfig;
    assets: AssetCatalog;
    state: GameState;
    inventory: Inventory;
}
