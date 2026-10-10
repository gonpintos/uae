export interface DebugConfig {
    enabled: boolean;
    showHotspots: boolean;
    showNavigation: boolean;
}

export interface ResolutionConfig {
    width: number;
    height: number;
}

export interface EngineConfig {
    debug: DebugConfig;
    resolution: ResolutionConfig;
}

export interface EngineConfigOptions {
    debug?: Partial<DebugConfig>;
    resolution?: Partial<ResolutionConfig>;
}

export const defaultEngineConfig: EngineConfig = {
    debug: {
        enabled: false,
        showHotspots: false,
        showNavigation: false
    },
    resolution: {
        width: 1280,
        height: 720
    }
};
