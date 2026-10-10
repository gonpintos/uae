import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { DialogueCollection } from "../../../packages/engine/src/dialogue/DialogueCollection";
import { DialoguePresenter } from "../../../packages/engine/src/dialogue/DialoguePresenter";
import { DialogueSession } from "../../../packages/engine/src/dialogue/DialogueSession";
import { RenderLayer } from "../../../packages/engine/src/graphics/RenderLayer";
import type { Renderer, TextOptions } from "../../../packages/engine/src/graphics/Renderer";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { GameState } from "../../../packages/engine/src/state/GameState";
import { ActorSpeechController } from "../../../packages/engine/src/speech/ActorSpeechController";
import { ActorSpeechRenderer } from "../../../packages/engine/src/speech/ActorSpeechRenderer";
import { demoActorsData } from "../src/data/demoActorsData";
import { demoDialoguesData } from "../src/data/demoDialoguesData";
import { demoItemsData } from "../src/data/demoItemsData";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
    }
}

async function flushMicrotasks(): Promise<void> {
    for (let index = 0; index < 6; index += 1) {
        await Promise.resolve();
    }
}

async function runTest(): Promise<void> {
    const actors = new ActorCollection(demoActorsData);
    const state = new GameState();
    const inventory = new Inventory(
        new InventoryItemCatalog(demoItemsData)
    );
    const session = new DialogueSession(
        new DialogueCollection(demoDialoguesData),
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

    const presenter = new DialoguePresenter(speech, () => undefined);

    const releaseNextLine = async (): Promise<void> => {
        const release = pendingSpeech.shift();

        if (!release) {
            throw new Error("A speech line should be waiting.");
        }

        release();
        await flushMicrotasks();
    };

    session.start("fede-sunglasses");

    const regularView = session.view;

    if (!regularView) {
        throw new Error("Fede dialogue should be active.");
    }

    const regularSelection = session.selectOption("ask-about-sunglasses");
    const regularPresentation = presenter.present(
        regularSelection,
        {
            playerActorId: regularView.player.id,
            npcActorId: regularView.npc.id
        }
    );

    assert(presenter.isPresenting, "The dialogue menu should hide during player speech");
    assert(speech.isSpeaking, "Speech should block input while the player line is visible");
    assertEqual(speech.current?.actorId, "franco", "The selected option should be spoken by the player");
    assertEqual(
        speech.current?.text,
        "¿Vos te comprarías esos anteojos?",
        "The selected option text should not be skipped"
    );

    await releaseNextLine();

    assert(presenter.isPresenting, "The menu should remain hidden during NPC speech");
    assert(speech.isSpeaking, "NPC speech should keep scene input blocked");
    assertEqual(speech.current?.actorId, "fede", "The NPC should speak after the player");
    assertEqual(
        speech.current?.text,
        "Claro que sí. Salvo que no.",
        "Fede should deliver the declared response"
    );

    await releaseNextLine();
    await regularPresentation;

    assert(!presenter.isPresenting, "The menu should return after a continuing turn");
    assert(!speech.isSpeaking, "Input should unlock after both lines disappear");
    assert(session.isActive, "A regular option should keep the dialogue active");
    assertEqual(
        spokenLines.slice(0, 2).join("\n"),
        [
            "franco:¿Vos te comprarías esos anteojos?",
            "fede:Claro que sí. Salvo que no."
        ].join("\n"),
        "Player speech should occur before NPC speech"
    );

    const exitView = session.view;

    if (!exitView) {
        throw new Error("Fede dialogue should still expose its exit option.");
    }

    const exitSelection = session.selectOption("leave");
    const exitPresentation = presenter.present(
        exitSelection,
        {
            playerActorId: exitView.player.id,
            npcActorId: exitView.npc.id
        }
    );

    assert(!session.isActive, "An exit option should close the dialogue session");
    assertEqual(speech.current?.actorId, "franco", "The exit line should still be spoken");

    await releaseNextLine();
    await exitPresentation;

    session.start("fede-sunglasses");

    const calculatorView = session.view;

    if (!calculatorView) {
        throw new Error("Fede dialogue should reopen for the calculator effect.");
    }

    const calculatorSelection = session.selectOption("ask-for-calculator");

    assert(inventory.has("calculator"), "giveItem should still run when the option is selected");
    assert(
        state.getValue("calculator-owned") === undefined,
        "Inventory should remain the source of truth for calculator ownership"
    );

    const calculatorPresentation = presenter.present(
        calculatorSelection,
        {
            playerActorId: calculatorView.player.id,
            npcActorId: calculatorView.npc.id
        }
    );

    await releaseNextLine();
    assertEqual(speech.current?.actorId, "fede", "Fede should answer the calculator request second");
    await releaseNextLine();
    assertEqual(speech.current?.text, "Gracias.", "The player closing line should be presented last");
    await releaseNextLine();
    await calculatorPresentation;

    assert(!session.isActive, "The calculator option should preserve its existing ending behavior");

    session.start("fede-sunglasses");

    const usageView = session.view;

    if (!usageView) {
        throw new Error("Fede dialogue should reopen with calculator advice.");
    }

    const usageSelection = session.selectOption("ask-how-to-use-calculator");
    const usagePresentation = presenter.present(
        usageSelection,
        {
            playerActorId: usageView.player.id,
            npcActorId: usageView.npc.id
        }
    );

    assertEqual(
        speech.current?.text,
        "¿Cómo se usa esta maravilla?",
        "Franco should ask the declared calculator question"
    );

    await releaseNextLine();
    assertEqual(speech.current?.actorId, "fede", "Fede should answer the usage question");
    assertEqual(
        speech.current?.text,
        "Usá la picardía.",
        "Fede should answer with the official line"
    );
    await releaseNextLine();
    await usagePresentation;

    assert(session.isActive, "Fede's menu should return after his calculator advice");
    assert(!presenter.isPresenting, "Calculator advice should finish presenting before the menu returns");

    const edgeActors = new ActorCollection([
        {
            id: "edge-actor",
            name: "Edge",
            x: 5,
            y: 100,
            width: 192,
            height: 272
        }
    ]);
    const drawnTexts: TextOptions[] = [];
    const renderer = {
        getSize: () => ({width: 1280, height: 720}),
        drawText: (options: TextOptions) => {
            drawnTexts.push(options);
        }
    } as unknown as Renderer;

    new ActorSpeechRenderer().draw(
        renderer,
        {
            actorId: "edge-actor",
            text: "Una línea suficientemente larga para ocupar varias líneas cerca del borde."
        },
        edgeActors
    );

    const renderedSpeech = drawnTexts[0];

    assert(renderedSpeech !== undefined, "Actor speech should render text");
    assert((renderedSpeech.x ?? 0) >= 20, "Speech should remain inside the left screen edge");
    assert(renderedSpeech.y === 20, "Speech above a high actor should clamp to the top edge");
    assert(renderedSpeech.text.includes("\n"), "Long speech should wrap across multiple lines");
    assert(renderedSpeech.anchorX === 0.5, "Speech should be centered over its actor");
    assert(renderedSpeech.layer === RenderLayer.Speech, "Speech should render above the scene");
    assert(renderedSpeech.strokeColor === "#000000", "Speech should use a black outline");
    assert(renderedSpeech.strokeWidth === 4, "Speech should use a readable outline width");

    const expectedSpeechColors = new Map([
        ["franco", "#fff3a6"],
        ["fede", "#d8b4fe"],
        ["gon", "#9fe8ff"]
    ]);

    for (const [actorId, expectedColor] of expectedSpeechColors) {
        drawnTexts.length = 0;
        new ActorSpeechRenderer().draw(
            renderer,
            {actorId, text: "Color declarado"},
            actors
        );
        assertEqual(
            drawnTexts[0]?.color,
            expectedColor,
            `${actorId} speech should use its declared color`
        );
        assertEqual(
            drawnTexts[0]?.strokeColor,
            "#000000",
            `${actorId} speech should preserve the black outline`
        );
    }

    assertEqual(speech.getDurationMs("Hola"), 1500, "Short speech should use the minimum duration");
    assertEqual(
        speech.getDurationMs("x".repeat(200)),
        5000,
        "Long speech should use the maximum duration"
    );

    console.log("Dialogue presentation functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
