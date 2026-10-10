import type { ActorSpeechController } from "../speech/ActorSpeechController";
import type { DialogueSelectionResult } from "./DialogueSession";

export interface DialogueTurnSpeakers {
    playerActorId: string;
    npcActorId: string;
}

export type DialoguePresentationChangedHandler = () => void;

export class DialoguePresenter {
    private readonly speech: ActorSpeechController;

    private readonly onChanged: DialoguePresentationChangedHandler;

    private presenting = false;

    private cancelled = false;

    public constructor(
        speech: ActorSpeechController,
        onChanged: DialoguePresentationChangedHandler
    ) {
        this.speech = speech;
        this.onChanged = onChanged;
    }

    public get isPresenting(): boolean {
        return this.presenting;
    }

    public async present(
        selection: DialogueSelectionResult,
        speakers: DialogueTurnSpeakers
    ): Promise<void> {
        if (this.presenting) {
            throw new Error("A dialogue turn is already being presented.");
        }

        this.presenting = true;
        this.cancelled = false;
        this.onChanged();

        try {
            await this.speech.say(
                speakers.playerActorId,
                selection.turn.playerLine
            );

            if (this.cancelled) {
                return;
            }

            if (selection.turn.npcLine) {
                await this.speech.say(
                    speakers.npcActorId,
                    selection.turn.npcLine
                );
            }

            if (this.cancelled) {
                return;
            }

            if (selection.turn.playerClosingLine) {
                await this.speech.say(
                    speakers.playerActorId,
                    selection.turn.playerClosingLine
                );
            }
        } finally {
            this.presenting = false;

            if (!this.cancelled) {
                this.onChanged();
            }
        }
    }

    public cancel(): void {
        this.cancelled = true;
        this.speech.cancel();
    }
}
