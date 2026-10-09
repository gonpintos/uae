export interface DebugConfig {
    enabled: boolean;
    showHotspots: boolean;
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
        showHotspots: false
    },
    resolution: {
        width: 1280,
        height: 720
    }
};