import {
    ActorAssetCollector,
    DiagnosticScene,
    Engine,
    InventoryAssetCollector,
    RoomAssetCollector
} from "@uae/engine";

import { demoAssets } from "./assets/demoAssets";
import { demoActorsData } from "./data/demoActorsData";
import { demoDialoguesData } from "./data/demoDialoguesData";
import { demoItemsData } from "./data/demoItemsData";
import { demoInteractionsData } from "./data/demoInteractionsData";
import { demoRoomsData } from "./data/demoRoomsData";
import { demoSequencesData } from "./data/demoSequencesData";
import { GameScene } from "./scenes/GameScene";

export class DemoApplication {
    private readonly engine: Engine;

    public constructor() {
        this.engine = new Engine();
    }

    public async run(container: HTMLElement): Promise<void> {
        const roomAssetCollector = new RoomAssetCollector();
        const actorAssetCollector = new ActorAssetCollector();
        const inventoryAssetCollector = new InventoryAssetCollector();

        const requiredAssetIds = [
            ...roomAssetCollector.collect(demoRoomsData),
            ...actorAssetCollector.collect(demoActorsData),
            ...inventoryAssetCollector.collect(demoItemsData)
        ];
    
        await this.engine.start({
            container,
            initialScene: new DiagnosticScene(
                () => new GameScene(
                    demoRoomsData,
                    "demo-room",
                    demoDialoguesData,
                    demoInteractionsData,
                    demoActorsData,
                    demoSequencesData
                )
            ),
            assets: demoAssets,
            requiredAssetIds,
            inventoryItems: demoItemsData,
            config: {
                debug: {
                    enabled: true,
                    showHotspots: false
                },
                resolution: {
                    width: 1280,
                    height: 720
                }
            }
        });
    }
}
