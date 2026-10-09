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

                actor.moveTo(action.x, action.y);
                this.callbacks.onActorMoved(actor);
                return true;
            }

            case "moveBySteps": {
                const actor = this.actors.getById(action.actorId);

                for (let step = 0; step < action.steps; step += 1) {
                    if (this.cancelled) {
                        return false;
                    }

                    actor.moveBy(action.deltaX, action.deltaY);
                    this.callbacks.onActorMoved(actor);

                    const hasNextStep = step < action.steps - 1;

                    if (hasNextStep && (action.stepDurationMs ?? 0) > 0) {
                        await this.delay(action.stepDurationMs ?? 0);
                    }
                }

                return true;
            }

            case "endScene":
                this.callbacks.onEndScene();
                return false;
        }
    }
}
