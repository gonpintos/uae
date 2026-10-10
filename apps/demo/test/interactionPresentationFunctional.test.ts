import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { InteractionExecutor } from "../../../packages/engine/src/interaction/InteractionExecutor";
import { InteractionPresenter } from "../../../packages/engine/src/interaction/InteractionPresenter";
import { VerbInteractionCollection } from "../../../packages/engine/src/interaction/VerbInteractionCollection";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { RoomCollection } from "../../../packages/engine/src/room/RoomCollection";
import { RoomManager } from "../../../packages/engine/src/room/RoomManager";
import { ActorSpeechController } from "../../../packages/engine/src/speech/ActorSpeechController";
import { GameState } from "../../../packages/engine/src/state/GameState";
import {
    contentActors,
    contentInteractions,
    contentItems
} from "./support/uaeTestContent";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

async function runTest(): Promise<void> {
    const actors = new ActorCollection(contentActors);
    const inventory = new Inventory(
        new InventoryItemCatalog(contentItems),
        ["calculator"]
    );
    const state = new GameState();
    const rooms = new RoomCollection([
        {
            id: "interaction-room",
            name: "Interaction Room",
            visuals: [],
            hotspots: []
        }
    ]);
    const executor = new InteractionExecutor(
        new RoomManager(rooms, "interaction-room"),
        new VerbInteractionCollection(contentInteractions),
        state,
        inventory
    );
    const pendingSpeech: Array<() => void> = [];
    const spokenLines: string[] = [];
    let speech: ActorSpeechController;

    speech = new ActorSpeechController(
        actors,
        () => {
            if (speech.current) {
                spokenLines.push(
                    `${speech.current.actorId}:${speech.current.text}`
                );
            }
        },
        {},
        () => new Promise((resolve) => {
            pendingSpeech.push(resolve);
        })
    );

    const presenter = new InteractionPresenter(speech);
    const lookResult = executor.execute("look", "sunglasses-stand");

    if (lookResult.type !== "say") {
        throw new Error("Looking at the stand should produce declarative speech.");
    }

    const lookPresentation = presenter.present(lookResult);

    assert(speech.isSpeaking, "A Look response should use ActorSpeechController");
    assert(
        speech.current?.text === "¡Uh, acá venden anteojos!\n75 coronas danesas.",
        "The Look response should appear as Franco speech"
    );
    pendingSpeech.shift()?.();
    await lookPresentation;

    const useResult = executor.execute("use", "calculator");

    if (useResult.type !== "say") {
        throw new Error("Using the calculator should produce declarative speech.");
    }

    const usePresentation = presenter.present(useResult);

    assert(speech.isSpeaking, "A Use response should use ActorSpeechController");
    assert(
        speech.current?.text === "No tengo la cotización de la corona danesa.",
        "The Use response should appear as Franco speech"
    );
    pendingSpeech.shift()?.();
    await usePresentation;

    assert(
        spokenLines.join("\n") === [
            "franco:¡Uh, acá venden anteojos!\n75 coronas danesas.",
            "franco:No tengo la cotización de la corona danesa."
        ].join("\n"),
        "Look and Use responses should share the actor speech pipeline"
    );

    console.log("Interaction speech presentation functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
