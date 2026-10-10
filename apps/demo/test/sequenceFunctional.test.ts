import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { ActionSequenceCollection } from "../../../packages/engine/src/sequence/ActionSequenceCollection";
import { ActionSequenceRunner } from "../../../packages/engine/src/sequence/ActionSequenceRunner";
import { ActorSpeechController } from "../../../packages/engine/src/speech/ActorSpeechController";
import { RenderLayer } from "../../../packages/engine/src/graphics/RenderLayer";
import type { Renderer, TextOptions } from "../../../packages/engine/src/graphics/Renderer";
import { ScreenTitle } from "../../../packages/engine/src/ui/ScreenTitle";
import { VerbController } from "../../../packages/engine/src/verb/VerbController";
import { demoActorsData } from "../src/data/demoActorsData";
import { demoSequencesData } from "../src/data/demoSequencesData";

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

async function runTest(): Promise<void> {
    const actors = new ActorCollection(demoActorsData);
    const sequences = new ActionSequenceCollection(demoSequencesData);
    const delays: number[] = [];
    const events: string[] = [];
    const speechDelays: number[] = [];
    const finalOrder: string[] = [];
    const actorStates: Array<{
        x: number;
        y: number;
        animation: string;
        frameAssetId: string | null;
        facing: string;
        flipped: boolean;
    }> = [];
    let sceneEnded = false;
    let shownTitle: string | null = null;
    let speech: ActorSpeechController;

    speech = new ActorSpeechController(
        actors,
        () => {
            if (speech.current) {
                const actor = actors.getById(speech.current.actorId);

                events.push(`say:${actor.name}:${speech.current.text}`);

                if (speech.current.text === "¡Uy! ¿Dónde están mis anteojos?") {
                    finalOrder.push("speech-final");
                }
            }
        },
        {},
        (durationMs) => {
            speechDelays.push(durationMs);
            return Promise.resolve();
        }
    );

    const runner = new ActionSequenceRunner(
        sequences,
        actors,
        {
            onActorMoved: (actor) => {
                actorStates.push({
                    x: actor.x,
                    y: actor.y,
                    animation: actor.currentAnimation,
                    frameAssetId: actor.currentFrameAssetId,
                    facing: actor.facing,
                    flipped: actor.flipHorizontal
                });

                if (
                    actor.x === 736 &&
                    actor.currentAnimation === "idle"
                ) {
                    finalOrder.push("moveBySteps(5):idle");
                }
            },
            onSay: (actor, message) =>
                speech.say(actor.id, message),
            onShowTitle: (text) => {
                assert(
                    !speech.isSpeaking,
                    "The final speech should finish before showing the title"
                );
                shownTitle = text;
                finalOrder.push(`showTitle:${text}`);
            },
            onEndScene: () => {
                sceneEnded = true;
                events.push("end");
                finalOrder.push("endScene");
            }
        },
        (durationMs) => {
            delays.push(durationMs);

            const actor = actors.getById("franco");

            if (durationMs === 3000 && actor.x === 736) {
                assertEqual(
                    actor.currentAnimation,
                    "idle",
                    "The final wait should begin after movement restores idle"
                );
                finalOrder.push("wait(3000)");
            }

            return Promise.resolve();
        }
    );

    const franco = actors.getById("franco");

    assertEqual(franco.currentAnimation, "idle", "Franco should start idle");
    assertEqual(franco.currentFrameAssetId, "franco-idle", "Franco should use his idle asset");
    assert(!franco.flipHorizontal, "Franco should initially face the source direction");

    const execution = runner.run("buy-sunglasses");

    assert(runner.isRunning, "The runner should lock input while the sequence is active");
    assertEqual(franco.currentAnimation, "walk", "moveTo should start the walk animation");
    assertEqual(franco.facing, "left", "Moving left should update actor direction");
    assert(franco.flipHorizontal, "Moving left should flip right-facing art");

    await execution;

    assert(!runner.isRunning, "The runner should release its running state after the sequence");
    assert(!speech.isSpeaking, "Sequence speech should clear before the next action");
    assert(sceneEnded, "The sequence should end the scene");
    assertEqual(speechDelays.length, 2, "Both sequence say actions should use actor speech timing");
    assertEqual(
        delays.join(","),
        "180,180,180,180,3000,180,180,180,180,180,3000",
        "Unexpected sequence delays"
    );
    assertEqual(
        events.join("\n"),
        [
            "say:Franco:¡Listo! Tengo mis anteojos.",
            "say:Franco:¡Uy! ¿Dónde están mis anteojos?",
            "end"
        ].join("\n"),
        "The declarative actions should execute in order"
    );
    assertEqual(
        finalOrder.join("\n"),
        [
            "moveBySteps(5):idle",
            "wait(3000)",
            "speech-final",
            "showTitle:CONTINUARÁ",
            "endScene"
        ].join("\n"),
        "The final sequence actions should execute in the requested order"
    );
    assertEqual(
        shownTitle,
        "CONTINUARÁ",
        "The title should remain available after endScene"
    );

    const walkFrameIds = new Set(
        actorStates
            .filter((state) => state.animation === "walk")
            .map((state) => state.frameAssetId)
    );

    for (const frameAssetId of [
        "franco-walk-01",
        "franco-walk-02",
        "franco-walk-03",
        "franco-walk-04"
    ]) {
        assert(
            walkFrameIds.has(frameAssetId),
            `The walk loop should render ${frameAssetId}`
        );
    }

    assert(
        actorStates.some(
            (state) =>
                state.animation === "idle" &&
                state.x === 536 &&
                state.facing === "left"
        ),
        "moveTo should restore idle while preserving the left-facing direction"
    );
    assert(
        actorStates.some(
            (state) =>
                state.animation === "walk" &&
                state.facing === "right" &&
                !state.flipped
        ),
        "moveBySteps should walk right without flipping the source art"
    );

    assertEqual(franco.x, 736, "Franco should finish five steps away from the stand");
    assertEqual(franco.y, 525, "Franco should preserve his ground anchor while walking away");
    assertEqual(franco.currentAnimation, "idle", "Franco should return to idle after walking");
    assertEqual(franco.currentFrameAssetId, "franco-idle", "Idle should restore its declared asset");
    assertEqual(franco.facing, "right", "Franco should finish facing his movement direction");
    assert(!franco.flipHorizontal, "Rightward movement should restore the original art direction");

    const titleDraws: TextOptions[] = [];
    const titleRenderer = {
        getSize: () => ({width: 1280, height: 720}),
        drawText: (options: TextOptions) => {
            titleDraws.push(options);
        }
    } as unknown as Renderer;

    new ScreenTitle().draw(titleRenderer, "CONTINUARÁ");

    assertEqual(titleDraws.length, 1, "ScreenTitle should draw one text element");
    assertEqual(titleDraws[0]?.text, "CONTINUARÁ", "ScreenTitle should draw the supplied text");
    assertEqual(titleDraws[0]?.x, 640, "ScreenTitle should center horizontally");
    assertEqual(titleDraws[0]?.y, 360, "ScreenTitle should center vertically");
    assertEqual(titleDraws[0]?.anchorX, 0.5, "ScreenTitle should use a centered horizontal anchor");
    assertEqual(titleDraws[0]?.anchorY, 0.5, "ScreenTitle should use a centered vertical anchor");
    assertEqual(titleDraws[0]?.layer, RenderLayer.Modal, "ScreenTitle should render on the top UI layer");

    const openingSequence = sequences.getById("opening-sunglasses");

    assertEqual(
        openingSequence.actions.length,
        1,
        "The opening should remain a minimal declarative sequence"
    );
    assertEqual(
        openingSequence.actions[0]?.type,
        "say",
        "The opening line should use the existing sequence speech action"
    );

    let releaseOpeningSpeech: (() => void) | null = null;
    let openingUIVisible = true;
    let openingUIInteractive = true;
    let openingClicks = 0;
    const openingVerbs = new VerbController();
    const openingSpeech = new ActorSpeechController(
        actors,
        () => undefined,
        {},
        () => new Promise((resolve) => {
            releaseOpeningSpeech = resolve;
        })
    );
    const openingRunner = new ActionSequenceRunner(
        sequences,
        actors,
        {
            onActorMoved: () => undefined,
            onSay: (actor, message) =>
                openingSpeech.say(actor.id, message),
            onShowTitle: () => undefined,
            onEndScene: () => undefined,
            onStarted: () => {
                openingUIVisible = true;
                openingUIInteractive = false;
            },
            onFinished: ({endedScene}) => {
                openingUIInteractive = !endedScene;
                openingVerbs.completeAction();
            }
        }
    );

    openingVerbs.select("look");

    const openingExecution = openingRunner.run("opening-sunglasses");

    assert(openingRunner.isRunning, "The opening scene should start blocked");
    assert(openingUIVisible, "The opening should keep the classic UI visible");
    assert(
        !openingUIInteractive,
        "The opening should disable interaction during speech"
    );
    assertEqual(
        actors.getById("franco").currentAnimation,
        "idle",
        "Franco should remain idle during the opening line"
    );
    assertEqual(
        openingSpeech.current?.actorId,
        "franco",
        "Franco should be the opening speaker"
    );
    assertEqual(
        openingSpeech.current?.text,
        "¡Necesito comprarme anteojos de sol!",
        "The opening should reproduce the declared line"
    );

    if (openingUIInteractive) {
        openingClicks += 1;
    }

    assertEqual(
        openingClicks,
        0,
        "Opening speech should block player clicks"
    );

    const finishOpeningSpeech =
        releaseOpeningSpeech as (() => void) | null;

    if (!finishOpeningSpeech) {
        throw new Error("The opening speech should be waiting to finish.");
    }

    finishOpeningSpeech();
    await openingExecution;

    assert(
        !openingSpeech.isSpeaking,
        "The opening must wait for speech to finish completely"
    );
    assert(
        openingUIInteractive,
        "The UI should become interactive after the opening line"
    );
    assertEqual(
        openingVerbs.selectedVerb,
        "goTo",
        "The opening should leave the default Go To verb selected"
    );

    const lifecycleSequences = new ActionSequenceCollection([
        {
            id: "non-ending-sequence",
            actions: [
                {
                    type: "wait",
                    durationMs: 25
                }
            ]
        },
        {
            id: "ending-sequence",
            actions: [
                {
                    type: "endScene"
                }
            ]
        }
    ]);
    let releaseNormalSequence: (() => void) | null = null;
    let uiVisible = true;
    let uiInteractive = true;
    let lifecycleSceneEnded = false;
    let executedClicks = 0;
    const completionStates: boolean[] = [];
    const lifecycleRunner = new ActionSequenceRunner(
        lifecycleSequences,
        actors,
        {
            onActorMoved: () => undefined,
            onSay: () => undefined,
            onShowTitle: () => undefined,
            onEndScene: () => {
                lifecycleSceneEnded = true;
                uiInteractive = false;
            },
            onStarted: () => {
                uiVisible = true;
                uiInteractive = false;
            },
            onFinished: ({endedScene}) => {
                completionStates.push(endedScene);
                uiVisible = true;

                if (!endedScene && !lifecycleSceneEnded) {
                    uiInteractive = true;
                }
            }
        },
        () => new Promise((resolve) => {
            releaseNormalSequence = resolve;
        })
    );
    const tryClick = (): void => {
        if (uiInteractive) {
            executedClicks += 1;
        }
    };
    const normalExecution = lifecycleRunner.run("non-ending-sequence");

    assert(uiVisible, "Sequence start should keep the classic UI visible");
    assert(!uiInteractive, "Sequence start should disable UI interaction");
    tryClick();
    assertEqual(
        executedClicks,
        0,
        "Clicks should not execute while a sequence is running"
    );

    const releaseSequence = releaseNormalSequence as (() => void) | null;

    if (!releaseSequence) {
        throw new Error("The non-ending sequence should be waiting.");
    }

    releaseSequence();
    await normalExecution;

    assert(
        uiInteractive,
        "A sequence without endScene should restore UI interaction"
    );
    tryClick();
    assertEqual(
        executedClicks,
        1,
        "Clicks should execute again after a normal sequence"
    );

    await lifecycleRunner.run("ending-sequence");

    assert(lifecycleSceneEnded, "endScene should mark the scene as ended");
    assert(uiVisible, "The UI should remain visible after endScene");
    assert(
        !uiInteractive,
        "The UI should remain disabled after endScene"
    );
    tryClick();
    assertEqual(
        executedClicks,
        1,
        "Clicks should remain blocked after endScene"
    );
    assertEqual(
        completionStates.join(","),
        "false,true",
        "Sequence completion should report whether endScene ran"
    );

    console.log("Scripted sequence functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
