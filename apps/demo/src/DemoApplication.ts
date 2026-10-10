import { Engine } from "@uae/engine";

import { loadUaeContent } from "./content/uaeContent";
import { createUaeInitialScene } from "./uaeSceneFlow";

export class DemoApplication {
    private readonly engine: Engine;

    public constructor() {
        this.engine = new Engine();
    }

    public async run(container: HTMLElement): Promise<void> {
        const game = loadUaeContent();

        globalThis.document.title = game.title;

        await this.engine.start({
            container,
            initialScene: createUaeInitialScene(game),
            assets: game.assets,
            requiredAssetIds: game.requiredAssetIds,
            initialState: game.initialState,
            inventoryItems: game.items,
            initialInventoryItemIds: game.initialInventoryItemIds,
            config: {
                debug: {
                    enabled: false,
                    showHotspots: false,
                    showNavigation: false
                },
                resolution: game.resolution
            }
        });
    }
}
