import type { Point } from "../math/Point";
import type { Actor } from "./Actor";
import type { ActorCollection } from "./ActorCollection";

export type MovementDelay = (durationMs: number) => Promise<void>;

export type ActorChangedHandler = (actor: Actor) => void;

const browserDelay: MovementDelay = (durationMs) =>
    new Promise((resolve) => {
        globalThis.setTimeout(resolve, durationMs);
    });

export class ActorMovementController {
    private readonly actors: ActorCollection;

    private readonly onActorChanged: ActorChangedHandler;

    private readonly delay: MovementDelay;

    private moving = false;

    private cancelled = false;

    public constructor(
        actors: ActorCollection,
        onActorChanged: ActorChangedHandler,
        delay: MovementDelay = browserDelay
    ) {
        this.actors = actors;
        this.onActorChanged = onActorChanged;
        this.delay = delay;
    }

    public get isMoving(): boolean {
        return this.moving;
    }

    public async moveTo(
        actorId: string,
        destination: Point,
        durationMs?: number
    ): Promise<boolean> {
        if (this.moving) {
            return false;
        }

        const actor = this.actors.getById(actorId);
        const startX = actor.x;
        const startY = actor.y;
        const deltaX = destination.x - startX;
        const deltaY = destination.y - startY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance === 0) {
            return true;
        }

        const resolvedDurationMs = durationMs ??
            distance / actor.walkSpeedPixelsPerSecond * 1000;

        this.moving = true;
        this.cancelled = false;
        actor.startMovement(deltaX);
        this.onActorChanged(actor);

        try {
            if (resolvedDurationMs <= 0) {
                actor.moveTo(destination.x, destination.y);
                actor.advanceAnimationFrame();
                this.onActorChanged(actor);
                return true;
            }

            let elapsedMs = 0;

            while (elapsedMs < resolvedDurationMs) {
                const frameDurationMs =
                    actor.currentFrameDurationMs ?? resolvedDurationMs;
                const tickDurationMs = Math.min(
                    frameDurationMs,
                    resolvedDurationMs - elapsedMs
                );

                await this.delay(tickDurationMs);

                if (this.cancelled) {
                    return false;
                }

                elapsedMs += tickDurationMs;

                const progress = elapsedMs / resolvedDurationMs;

                actor.moveTo(
                    startX + deltaX * progress,
                    startY + deltaY * progress
                );
                actor.advanceAnimationFrame();
                this.onActorChanged(actor);
            }

            return true;
        } finally {
            actor.stopMovement();
            this.moving = false;
            this.onActorChanged(actor);
        }
    }

    public async moveBySteps(
        actorId: string,
        steps: number,
        delta: Point,
        stepDurationMs = 0
    ): Promise<boolean> {
        if (this.moving) {
            return false;
        }

        const actor = this.actors.getById(actorId);

        this.moving = true;
        this.cancelled = false;
        actor.startMovement(delta.x * steps);
        this.onActorChanged(actor);

        try {
            for (let step = 0; step < steps; step += 1) {
                if (this.cancelled) {
                    return false;
                }

                actor.moveBy(delta.x, delta.y);
                this.onActorChanged(actor);

                const completedStep = await this.animateForDuration(
                    actor,
                    stepDurationMs
                );

                if (!completedStep) {
                    return false;
                }
            }

            return !this.cancelled;
        } finally {
            actor.stopMovement();
            this.moving = false;
            this.onActorChanged(actor);
        }
    }

    public cancel(): void {
        this.cancelled = true;
    }

    private async animateForDuration(
        actor: Actor,
        durationMs: number
    ): Promise<boolean> {
        let elapsedMs = 0;

        while (elapsedMs < durationMs) {
            const frameDurationMs =
                actor.currentFrameDurationMs ?? durationMs;
            const tickDurationMs = Math.min(
                frameDurationMs,
                durationMs - elapsedMs
            );

            await this.delay(tickDurationMs);

            if (this.cancelled) {
                return false;
            }

            elapsedMs += tickDurationMs;
            actor.advanceAnimationFrame();
            this.onActorChanged(actor);
        }

        return true;
    }
}
