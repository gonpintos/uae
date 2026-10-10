import type { ActorSpeechController } from "../speech/ActorSpeechController";
import type { SayInteractionResult } from "./InteractionResult";

export class InteractionPresenter {
    private readonly speech: ActorSpeechController;

    public constructor(speech: ActorSpeechController) {
        this.speech = speech;
    }

    public async present(result: SayInteractionResult): Promise<void> {
        await this.speech.say(result.actorId, result.message);
    }
}
