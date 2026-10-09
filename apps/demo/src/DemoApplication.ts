import {
    DiagnosticScene,
    Engine,
    RoomAssetCollector
} from "@uae/engine";

import { demoAssets } from "./assets/demoAssets";
import { demoDialoguesData } from "./data/demoDialoguesData";
import { demoItemsData } from "./data/demoItemsData";
import { demoRoomsData } from "./data/demoRoomsData";
import { GameScene } from "./scenes/GameScene";

export class DemoApplication {
    private readonly engine: Engine;

    public constructor() {
        this.engine = new Engine();
    }

    public async run(container: HTMLElement): Promise<void> {
        const roomAssetCollector = new RoomAssetCollector();

        const requiredAssetIds = roomAssetCollector.collect(demoRoomsData);
    
        await this.engine.start({
            container,
            initialScene: new DiagnosticScene(
                () => new GameScene(
                    demoRoomsData,
                    "demo-room",
                    demoDialoguesData
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
