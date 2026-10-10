import type { Actor } from "../actor/Actor";
import type { ActorCollection } from "../actor/ActorCollection";
import {
    ActorMovementController,
    type MovementDelay
} from "../actor/ActorMovementController";
import type { ActionSequenceCollection } from "./ActionSequenceCollection";
import type { ActionSequenceStep } from "./ActionSequenceData";

export type SequenceDelay = MovementDelay;

export interface ActionSequenceCompletion {
    endedScene: boolean;
    cancelled: boolean;
}

export interface ActionSequenceCallbacks {
    onActorMoved(actor: Actor): void;
    onSay(actor: Actor, message: string): void | Promise<void>;
    onShowTitle(text: string): void;
    onEndScene(): void;
    onStarted?(): void;
    onFinished?(completion: ActionSequenceCompletion): void;
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

    private readonly movement: ActorMovementController;

    private running = false;

    private cancelled = false;

    private endedScene = false;

    public constructor(
        sequences: ActionSequenceCollection,
        actors: ActorCollection,
        callbacks: ActionSequenceCallbacks,
        delay: SequenceDelay = browserDelay,
        movement?: ActorMovementController
    ) {
        this.sequences = sequences;
        this.actors = actors;
        this.callbacks = callbacks;
        this.delay = delay;
        this.movement = movement ?? new ActorMovementController(
            actors,
            callbacks.onActorMoved,
            delay
        );
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
        this.endedScene = false;

        try {
            this.callbacks.onStarted?.();

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
            this.callbacks.onFinished?.({
                endedScene: this.endedScene,
                cancelled: this.cancelled
            });
        }
    }

    public cancel(): void {
        this.cancelled = true;
        this.movement.cancel();
    }

    private async execute(action: ActionSequenceStep): Promise<boolean> {
        switch (action.type) {
            case "wait":
                await this.delay(action.durationMs);
                return true;

            case "say": {
                const actor = this.actors.getById(action.actorId);

                await this.callbacks.onSay(actor, action.message);
                return true;
            }

            case "moveTo": {
                return this.movement.moveTo(
                    action.actorId,
                    {
                        x: action.x,
                        y: action.y
                    },
                    action.durationMs ?? 0
                );
            }

            case "moveBySteps": {
                return this.movement.moveBySteps(
                    action.actorId,
                    action.steps,
                    {
                        x: action.deltaX,
                        y: action.deltaY
                    },
                    action.stepDurationMs ?? 0
                );
            }

            case "showTitle":
                this.callbacks.onShowTitle(action.text);
                return true;

            case "endScene":
                this.endedScene = true;
                this.callbacks.onEndScene();
                return false;
        }
    }
}
