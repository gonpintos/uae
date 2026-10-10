import {
    ActorAssetCollector,
    Engine,
    IntroAssetCollector,
    InventoryAssetCollector,
    RoomAssetCollector
} from "@uae/engine";

import { demoAssets } from "./assets/demoAssets";
import { demoActorsData } from "./data/demoActorsData";
import { demoItemsData } from "./data/demoItemsData";
import { demoIntroData } from "./data/demoIntroData";
import { demoRoomsData } from "./data/demoRoomsData";
import { createDemoInitialScene } from "./demoSceneFlow";

export class DemoApplication {
    private readonly engine: Engine;

    public constructor() {
        this.engine = new Engine();
    }

    public async run(container: HTMLElement): Promise<void> {
        const roomAssetCollector = new RoomAssetCollector();
        const actorAssetCollector = new ActorAssetCollector();
        const introAssetCollector = new IntroAssetCollector();
        const inventoryAssetCollector = new InventoryAssetCollector();

        const requiredAssetIds = [
            ...introAssetCollector.collect(demoIntroData),
            ...roomAssetCollector.collect(demoRoomsData),
            ...actorAssetCollector.collect(demoActorsData),
            ...inventoryAssetCollector.collect(demoItemsData)
        ];
    
        await this.engine.start({
            container,
            initialScene: createDemoInitialScene(),
            assets: demoAssets,
            requiredAssetIds,
            inventoryItems: demoItemsData,
            config: {
                debug: {
                    enabled: false,
                    showHotspots: false,
                    showNavigation: false
                },
                resolution: {
                    width: 1280,
                    height: 720
                }
            }
        });
    }
}
