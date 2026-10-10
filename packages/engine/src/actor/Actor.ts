import type {
    ActorAnimationClipData,
    ActorAnimationSetData,
    ActorData,
    ActorFacingDirection
} from "./ActorData";

export type ActorAnimationName = "idle" | "walk";

export class Actor {
    public readonly id: string;

    public readonly name: string;

    public readonly width: number;

    public readonly height: number;

    public readonly walkSpeedPixelsPerSecond: number;

    public readonly color: string;

    public readonly speechColor: string | undefined;

    public readonly layer: number | undefined;

    private readonly animations: ActorAnimationSetData | undefined;

    private readonly sourceFacing: ActorFacingDirection;

    private positionX: number;

    private positionY: number;

    private facingDirection: ActorFacingDirection;

    private animationName: ActorAnimationName = "idle";

    private animationFrameIndex = 0;

    public constructor(data: ActorData) {
        this.id = data.id;
        this.name = data.name;
        this.positionX = data.x;
        this.positionY = data.y;
        this.width = data.width;
        this.height = data.height;
        this.walkSpeedPixelsPerSecond =
            data.walkSpeedPixelsPerSecond ?? 240;
        this.color = data.color ?? "#47704f";
        this.speechColor = data.speechColor;
        this.layer = data.layer;
        this.animations = data.animations;
        this.sourceFacing = data.animations?.sourceFacing ?? "right";
        this.facingDirection = data.initialFacing ?? this.sourceFacing;

        this.validateAnimations();

        if (
            !Number.isFinite(this.walkSpeedPixelsPerSecond) ||
            this.walkSpeedPixelsPerSecond <= 0
        ) {
            throw new Error(`Actor "${this.id}" has an invalid walk speed.`);
        }
    }

    public get x(): number {
        return this.positionX;
    }

    public get y(): number {
        return this.positionY;
    }

    public get facing(): ActorFacingDirection {
        return this.facingDirection;
    }

    public get currentAnimation(): ActorAnimationName {
        return this.animationName;
    }

    public get currentFrameAssetId(): string | null {
        const clip = this.getCurrentClip();

        return clip?.frameAssetIds[this.animationFrameIndex] ?? null;
    }

    public get currentFrameDurationMs(): number | null {
        return this.getCurrentClip()?.frameDurationMs ?? null;
    }

    public get flipHorizontal(): boolean {
        return this.facingDirection !== this.sourceFacing;
    }

    public moveTo(x: number, y: number): void {
        this.positionX = x;
        this.positionY = y;
    }

    public moveBy(deltaX: number, deltaY: number): void {
        this.positionX += deltaX;
        this.positionY += deltaY;
    }

    public faceToward(targetX: number): void {
        if (targetX < this.positionX) {
            this.facingDirection = "left";
        } else if (targetX > this.positionX) {
            this.facingDirection = "right";
        }
    }

    public startMovement(deltaX: number): void {
        if (deltaX < 0) {
            this.facingDirection = "left";
        } else if (deltaX > 0) {
            this.facingDirection = "right";
        }

        this.animationName = this.animations?.walk ? "walk" : "idle";
        this.animationFrameIndex = 0;
    }

    public advanceAnimationFrame(): void {
        const clip = this.getCurrentClip();

        if (!clip || clip.frameAssetIds.length <= 1) {
            return;
        }

        this.animationFrameIndex =
            (this.animationFrameIndex + 1) % clip.frameAssetIds.length;
    }

    public stopMovement(): void {
        this.animationName = "idle";
        this.animationFrameIndex = 0;
    }

    private getCurrentClip(): ActorAnimationClipData | undefined {
        if (!this.animations) {
            return undefined;
        }

        return this.animationName === "walk"
            ? this.animations.walk ?? this.animations.idle
            : this.animations.idle;
    }

    private validateAnimations(): void {
        if (!this.animations) {
            return;
        }

        this.validateClip("idle", this.animations.idle);

        if (this.animations.walk) {
            this.validateClip("walk", this.animations.walk);
        }
    }

    private validateClip(
        name: ActorAnimationName,
        clip: ActorAnimationClipData
    ): void {
        if (clip.frameAssetIds.length === 0) {
            throw new Error(`Actor "${this.id}" has no frames for ${name}.`);
        }

        for (const assetId of clip.frameAssetIds) {
            if (!assetId.trim()) {
                throw new Error(`Actor "${this.id}" has an empty ${name} frame asset id.`);
            }
        }

        if (
            clip.frameDurationMs !== undefined &&
            (!Number.isFinite(clip.frameDurationMs) || clip.frameDurationMs <= 0)
        ) {
            throw new Error(`Actor "${this.id}" has an invalid ${name} frame duration.`);
        }
    }
}
