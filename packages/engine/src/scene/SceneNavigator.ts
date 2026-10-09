import type { Scene } from "./Scene";

export interface SceneNavigator {
    changeScene(scene: Scene): void;
}