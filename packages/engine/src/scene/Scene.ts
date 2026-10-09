import type { SceneContext } from "./SceneContext";

export interface Scene {
    enter(context: SceneContext): void;

    exit(context: SceneContext): void;
}