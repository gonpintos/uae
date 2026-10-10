import type { ActorCollection } from "../actor/ActorCollection";

export interface ActorSpeech {
    actorId: string;
    text: string;
}

export interface ActorSpeechTimingOptions {
    minimumDurationMs?: number;
    maximumDurationMs?: number;
    millisecondsPerCharacter?: number;
}

export type SpeechDelay = (durationMs: number) => Promise<void>;

export type SpeechChangedHandler = () => void;

const browserDelay: SpeechDelay = (durationMs) =>
    new Promise((resolve) => {
        globalThis.setTimeout(resolve, durationMs);
    });

export class ActorSpeechController {
    private readonly actors: ActorCollection;

    private readonly minimumDurationMs: number;

    private readonly maximumDurationMs: number;

    private readonly millisecondsPerCharacter: number;

    private readonly onChanged: SpeechChangedHandler;

    private readonly delay: SpeechDelay;

    private activeSpeech: ActorSpeech | null = null;

    private cancelled = false;

    public constructor(
        actors: ActorCollection,
        onChanged: SpeechChangedHandler,
        timing: ActorSpeechTimingOptions = {},
        delay: SpeechDelay = browserDelay
    ) {
        this.actors = actors;
        this.onChanged = onChanged;
        this.minimumDurationMs = timing.minimumDurationMs ?? 1500;
        this.maximumDurationMs = timing.maximumDurationMs ?? 5000;
        this.millisecondsPerCharacter =
            timing.millisecondsPerCharacter ?? 55;
        this.delay = delay;

        this.validateTiming();
    }

    public get current(): ActorSpeech | null {
        return this.activeSpeech;
    }

    public get isSpeaking(): boolean {
        return this.activeSpeech !== null;
    }

    public async say(actorId: string, text: string): Promise<void> {
        if (this.cancelled) {
            return;
        }

        if (this.activeSpeech) {
            throw new Error("An actor is already speaking.");
        }

        this.actors.getById(actorId);

        if (!text.trim()) {
            throw new Error("Actor speech cannot be empty.");
        }

        this.activeSpeech = {
            actorId,
            text
        };
        this.onChanged();

        try {
            await this.delay(this.getDurationMs(text));
        } finally {
            if (!this.cancelled) {
                this.activeSpeech = null;
                this.onChanged();
            }
        }
    }

    public getDurationMs(text: string): number {
        const proportionalDuration =
            text.trim().length * this.millisecondsPerCharacter;

        return Math.min(
            this.maximumDurationMs,
            Math.max(this.minimumDurationMs, proportionalDuration)
        );
    }

    public cancel(): void {
        this.cancelled = true;
        this.activeSpeech = null;
    }

    private validateTiming(): void {
        if (
            !Number.isFinite(this.minimumDurationMs) ||
            !Number.isFinite(this.maximumDurationMs) ||
            !Number.isFinite(this.millisecondsPerCharacter) ||
            this.minimumDurationMs < 0 ||
            this.maximumDurationMs < this.minimumDurationMs ||
            this.millisecondsPerCharacter <= 0
        ) {
            throw new Error("Invalid actor speech timing configuration.");
        }
    }
}
