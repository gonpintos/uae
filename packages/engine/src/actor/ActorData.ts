export type ActorFacingDirection = "left" | "right";

export interface ActorAnimationClipData {
    frameAssetIds: readonly string[];
    frameDurationMs?: number;
}

export interface ActorAnimationSetData {
    idle: ActorAnimationClipData;
    walk?: ActorAnimationClipData;
    sourceFacing?: ActorFacingDirection;
}

export interface ActorData {
    id: string;
    name: string;
    /** Ground anchor centered between the actor's feet. */
    x: number;
    y: number;
    width: number;
    height: number;
    walkSpeedPixelsPerSecond?: number;
    color?: string;
    speechColor?: string;
    layer?: number;
    initialFacing?: ActorFacingDirection;
    animations?: ActorAnimationSetData;
}
