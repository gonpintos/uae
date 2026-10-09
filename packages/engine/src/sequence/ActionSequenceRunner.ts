import type { Actor } from "../actor/Actor";
import type { ActorCollection } from "../actor/ActorCollection";
import type { ActionSequenceCollection } from "./ActionSequenceCollection";
import type { ActionSequenceStep } from "./ActionSequenceData";

export type SequenceDelay = (durationMs: number) => Promise<void>;

export interface ActionSequenceCallbacks {
    onActorMoved(actor: Actor): void;
    onSay(actor: Actor, message: string): void;
    onEndScene(): void;
}

const browserDelay: SequenceDelay = (durationMs) =>
    new Promise((resolve) => {
        globalThis.setTimeout(resolve, durationMs);
    });

export class ActionSequenceRunner {
    private readonly sequences: ActionSequenceCollection;

    private readonly actors: ActorCollection;

    private readonly callbacks: ActionSequenceCallbacks;

    private readonly delay: SequenceDelay;

    private running = false;

    private cancelled = false;

    public constructor(
        sequences: ActionSequenceCollection,
        actors: ActorCollection,
        callbacks: ActionSequenceCallbacks,
        delay: SequenceDelay = browserDelay
    ) {
        this.sequences = sequences;
        this.actors = actors;
        this.callbacks = callbacks;
        this.delay = delay;
    }

    public get isRunning(): boolean {
        return this.running;
    }

    public async run(sequenceId: string): Promise<void> {
        if (this.running) {
            throw new Error("An action sequence is already running.");
        }

        const sequence = this.sequences.getById(sequenceId);

        this.running = true;
        this.cancelled = false;

        try {
            for (const action of sequence.actions) {
                if (this.cancelled) {
                    return;
                }

                const shouldContinue = await this.execute(action);

                if (!shouldContinue) {
                    return;
                }
            }
        } finally {
            this.running = false;
        }
    }

    public cancel(): void {
        this.cancelled = true;
    }

    private async execute(action: ActionSequenceStep): Promise<boolean> {
        switch (action.type) {
            case "wait":
                await this.delay(action.durationMs);
                return true;

            case "say": {
                const actor = this.actors.getById(action.actorId);

                this.callbacks.onSay(actor, action.message);
                return true;
            }

            case "moveTo": {
                const actor = this.actors.getById(action.actorId);

                return this.moveTo(
                    actor,
                    action.x,
                    action.y,
                    action.durationMs ?? 0
                );
            }

            case "moveBySteps": {
                const actor = this.actors.getById(action.actorId);

                return this.moveBySteps(
                    actor,
                    action.steps,
                    action.deltaX,
                    action.deltaY,
                    action.stepDurationMs ?? 0
                );
            }

            case "endScene":
                this.callbacks.onEndScene();
                return false;
        }
    }

    private async moveTo(
        actor: Actor,
        targetX: number,
        targetY: number,
        durationMs: number
    ): Promise<boolean> {
        const startX = actor.x;
        const startY = actor.y;
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        actor.startMovement(deltaX);
        this.callbacks.onActorMoved(actor);

        try {
            if (durationMs <= 0) {
                actor.moveTo(targetX, targetY);
                actor.advanceAnimationFrame();
                this.callbacks.onActorMoved(actor);
                return true;
            }

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

                const progress = elapsedMs / durationMs;

                actor.moveTo(
                    startX + deltaX * progress,
                    startY + deltaY * progress
                );
                actor.advanceAnimationFrame();
                this.callbacks.onActorMoved(actor);
            }

            return true;
        } finally {
            actor.stopMovement();
            this.callbacks.onActorMoved(actor);
        }
    }

    private async moveBySteps(
        actor: Actor,
        steps: number,
        deltaX: number,
        deltaY: number,
        stepDurationMs: number
    ): Promise<boolean> {
        actor.startMovement(deltaX * steps);
        this.callbacks.onActorMoved(actor);

        try {
            for (let step = 0; step < steps; step += 1) {
                if (this.cancelled) {
                    return false;
                }

                actor.moveBy(deltaX, deltaY);
                this.callbacks.onActorMoved(actor);

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
            this.callbacks.onActorMoved(actor);
        }
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
            this.callbacks.onActorMoved(actor);
        }

        return true;
    }
}
