import {
    IntroScene,
    SceneEntryRegistry,
    type Scene,
    type UaeLoadedGame
} from "@uae/engine";

import { GameScene } from "./scenes/GameScene";

export function createUaeGameScene(
    game: UaeLoadedGame,
    entries: SceneEntryRegistry
): GameScene {
    const scene = game.initialScene;

    return new GameScene(
        scene.rooms,
        scene.initialRoomId,
        scene.dialogues,
        scene.interactions,
        scene.actors,
        scene.sequences,
        scene.controlledActorId,
        scene.entry?.sequenceId,
        {
            verbs: game.verbs,
            sceneId: scene.id,
            entryOnce: scene.entry?.once,
            entryRegistry: entries
        }
    );
}

export function createUaeInitialScene(game: UaeLoadedGame): Scene {
    const entries = new SceneEntryRegistry();
    const createGameScene = (): GameScene => createUaeGameScene(game, entries);

    return game.intro
        ? new IntroScene(game.intro, createGameScene)
        : createGameScene();
}
