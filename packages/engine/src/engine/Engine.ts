import {
    AssetCatalog,
    type AssetDefinitions
} from "../assets/AssetCatalog";
import {
    defaultEngineConfig,
    type EngineConfig,
    type EngineConfigOptions
} from "../config/EngineConfig";
import type { Renderer } from "../graphics/Renderer";
import { PixiRenderer } from "../graphics/PixiRenderer";
import type { InputManager } from "../input/InputManager";
import { BrowserInputManager } from "../input/BrowserInputManager";
import type { Scene } from "../scene/Scene";
import { SceneManager } from "../scene/SceneManager";
import { GameState } from "../state/GameState";
import type { GameStateData } from "../state/GameStateData";

export interface EngineOptions {
    container: HTMLElement;
    initialScene: Scene;
    config?: Partial<EngineConfigOptions>;
    assets?: AssetDefinitions;
    requiredAssetIds?: readonly string[];
    initialState?: GameStateData;
}

export class Engine {
    private readonly renderer: Renderer;

    private readonly input: InputManager;

    private sceneManager: SceneManager | null = null;

    public constructor() {
        this.renderer = new PixiRenderer();
        this.input = new BrowserInputManager();
    }

    public async start(options: EngineOptions): Promise<void> {
        console.log("=================================");
        console.log("Ultrasoft Adventure Engine");
        console.log("Engine starting...");
        console.log("=================================");

        const config: EngineConfig = {
            ...defaultEngineConfig,
            ...options.config,

            debug: {
                ...defaultEngineConfig.debug,
                ...options.config?.debug
            },

            resolution: {
                ...defaultEngineConfig.resolution,
                ...options.config?.resolution
            }
        };

        const {
            width: logicalWidth,
            height: logicalHeight
        } = config.resolution;

        if (
            !Number.isFinite(logicalWidth) ||
            !Number.isFinite(logicalHeight) ||
            logicalWidth <= 0 ||
            logicalHeight <= 0
        ) {
            throw new Error(`Invalid logical resolution: ${logicalWidth} × ${logicalHeight}`);
        }

        console.log(`Logical resolution: ${logicalWidth} × ${logicalHeight}`);

        const assetCatalog = new AssetCatalog(options.assets);
        const state = new GameState(options.initialState);
        
        await this.renderer.initialize(
            options.container,
            config.resolution
        );

        console.log("Renderer initialized.");

        
        const assetSources =
            options.requiredAssetIds
                ? assetCatalog.getSources(options.requiredAssetIds)
                : assetCatalog.getAllSources();

        await this.renderer.loadImages(assetSources);

        console.log(`Assets loaded: ${assetSources.length}`);
        
        this.input.initialize(
            this.renderer.getInputTarget(),
            (browserPosition) => this.renderer.toLogicalPosition(browserPosition)
        );

        console.log("Input initialized.");

        this.sceneManager = new SceneManager(
            this.renderer,
            this.input,
            config,
            assetCatalog,
            state
        );

        this.sceneManager.changeScene(options.initialScene);

        console.log(`Logical resolution: ${config.resolution.width} × ${config.resolution.height}`);

        console.log(`Debug mode: ${config.debug.enabled}`);

        console.log("Initial scene loaded.");
        console.log("Engine ready.");
    }
}
