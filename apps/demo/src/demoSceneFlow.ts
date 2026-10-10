import { IntroScene, type Scene } from "@uae/engine";

import { demoActorsData } from "./data/demoActorsData";
import { demoDialoguesData } from "./data/demoDialoguesData";
import { demoInteractionsData } from "./data/demoInteractionsData";
import { demoIntroData } from "./data/demoIntroData";
import { demoRoomsData } from "./data/demoRoomsData";
import { demoSequencesData } from "./data/demoSequencesData";
import { GameScene } from "./scenes/GameScene";

export function createDemoGameScene(): GameScene {
    return new GameScene(
        demoRoomsData,
        "demo-room",
        demoDialoguesData,
        demoInteractionsData,
        demoActorsData,
        demoSequencesData,
        "franco",
        "opening-sunglasses"
    );
}

export function createDemoInitialScene(): Scene {
    return new IntroScene(
        demoIntroData,
        createDemoGameScene
    );
}
