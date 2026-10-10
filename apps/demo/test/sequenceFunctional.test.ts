import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { ActionSequenceCollection } from "../../../packages/engine/src/sequence/ActionSequenceCollection";
import { ActionSequenceRunner } from "../../../packages/engine/src/sequence/ActionSequenceRunner";
import { ActorSpeechController } from "../../../packages/engine/src/speech/ActorSpeechController";
import { RenderLayer } from "../../../packages/engine/src/graphics/RenderLayer";
import type { Renderer, TextOptions } from "../../../packages/engine/src/graphics/Renderer";
import { ScreenTitle } from "../../../packages/engine/src/ui/ScreenTitle";
import { VerbController } from "../../../packages/engine/src/verb/VerbController";
import { contentActors, contentSequences } from "./support/uaeTestContent";

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
    const actors = new ActorCollection(contentActors);
    const sequences = new ActionSequenceCollection(contentSequences);
    const buySequence = sequences.getById("buy-sunglasses");
    const buySayActions = buySequence.actions.filter(
        (action) => action.type === "say"
    );
    const finalSayAction = [...buySayActions].at(-1);
    const finalWaitAction = [...buySequence.actions]
        .reverse()
        .find((action) => action.type === "wait");
    const titleAction = buySequence.actions.find(
        (action) => action.type === "showTitle"
    );

    if (!finalSayAction || !finalWaitAction || !titleAction) {
        throw new Error("The buy sequence should declare final speech, wait, and title actions.");
    }

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
    let startedUIPolicy: string | null = null;
    let finishedUIPolicy: string | null = null;
    let speech: ActorSpeechController;

    speech = new ActorSpeechController(
        actors,
        () => {
            if (speech.current) {
                const actor = actors.getById(speech.current.actorId);

                events.push(`say:${actor.name}:${speech.current.text}`);

                if (speech.current.text === finalSayAction.message) {
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
            },
            onStarted: (sequence) => {
                startedUIPolicy = sequence.ui ?? null;
            },
            onFinished: ({sequence}) => {
                finishedUIPolicy = sequence.ui ?? null;
            }
        },
        (durationMs) => {
            delays.push(durationMs);

            const actor = actors.getById("franco");

            if (
                durationMs === finalWaitAction.durationMs &&
                actor.x === 736
            ) {
                assertEqual(
                    actor.currentAnimation,
                    "idle",
                    "The final wait should begin after movement restores idle"
                );
                finalOrder.push(`wait(${durationMs})`);
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
    assertEqual(startedUIPolicy, "hidden", "The runner should expose the declared UI policy on start");
    assertEqual(finishedUIPolicy, "hidden", "The runner should preserve the UI policy through completion");
    assertEqual(
        speechDelays.length,
        buySayActions.length,
        "Every sequence say action should use actor speech timing"
    );
    assertEqual(
        delays.filter((duration) => duration === finalWaitAction.durationMs).length,
        buySequence.actions.filter(
            (action) =>
                action.type === "wait" &&
                action.durationMs === finalWaitAction.durationMs
        ).length,
        "Every declared sequence wait should pass through the delay pipeline"
    );
    assertEqual(
        events.join("\n"),
        [
            ...buySayActions.map((action) =>
                `say:${actors.getById(action.actorId).name}:${action.message}`
            ),
            "end"
        ].join("\n"),
        "The declarative actions should execute in order"
    );
    assertEqual(
        finalOrder.join("\n"),
        [
            "moveBySteps(5):idle",
            `wait(${finalWaitAction.durationMs})`,
            "speech-final",
            `showTitle:${titleAction.text}`,
            "endScene"
        ].join("\n"),
        "The final sequence actions should execute in the requested order"
    );
    assertEqual(
        shownTitle,
        titleAction.text,
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

    new ScreenTitle().draw(titleRenderer, titleAction.text);

    assertEqual(titleDraws.length, 1, "ScreenTitle should draw one text element");
    assertEqual(titleDraws[0]?.text, titleAction.text, "ScreenTitle should draw the supplied text");
    assertEqual(titleDraws[0]?.x, 640, "ScreenTitle should center horizontally");
    assertEqual(titleDraws[0]?.y, 360, "ScreenTitle should center vertically");
    assertEqual(titleDraws[0]?.anchorX, 0.5, "ScreenTitle should use a centered horizontal anchor");
    assertEqual(titleDraws[0]?.anchorY, 0.5, "ScreenTitle should use a centered vertical anchor");
    assertEqual(titleDraws[0]?.layer, RenderLayer.Modal, "ScreenTitle should render on the top UI layer");

    const openingSequence = sequences.getById("opening-sunglasses");
    const openingSayAction = openingSequence.actions[0];

    if (openingSayAction?.type !== "say") {
        throw new Error("The opening sequence should begin with speech.");
    }

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
    assertEqual(
        openingSequence.ui,
        undefined,
        "A sequence without ui should retain the default visible policy"
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
            onStarted: (sequence) => {
                openingUIVisible = sequence.ui !== "hidden";
                openingUIInteractive = false;
            },
            onFinished: ({endedScene, sequence}) => {
                openingUIVisible = !endedScene || sequence.ui !== "hidden";
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
        openingSayAction.message,
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
        },
        {
            id: "hidden-non-ending-sequence",
            ui: "hidden",
            actions: [
                {
                    type: "wait",
                    durationMs: 25
                }
            ]
        },
        {
            id: "hidden-ending-sequence",
            ui: "hidden",
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
            onStarted: (sequence) => {
                uiVisible = sequence.ui !== "hidden";
                uiInteractive = false;
            },
            onFinished: ({endedScene, sequence}) => {
                completionStates.push(endedScene);
                uiVisible = !endedScene || sequence.ui !== "hidden";

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

    const hiddenNormalExecution = lifecycleRunner.run(
        "hidden-non-ending-sequence"
    );

    assert(!uiVisible, "ui: hidden should hide the classic UI while running");
    assert(!uiInteractive, "A hidden UI sequence should still block input");
    tryClick();
    assertEqual(
        executedClicks,
        1,
        "A hidden UI sequence should block clicks"
    );

    const releaseHiddenSequence = releaseNormalSequence as (() => void) | null;

    if (!releaseHiddenSequence) {
        throw new Error("The hidden non-ending sequence should be waiting.");
    }

    releaseHiddenSequence();
    await hiddenNormalExecution;

    assert(uiVisible, "A normal hidden sequence should restore the UI");
    assert(uiInteractive, "A normal hidden sequence should restore input");

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

    lifecycleSceneEnded = false;
    uiVisible = true;
    uiInteractive = true;

    await lifecycleRunner.run("hidden-ending-sequence");

    assert(
        !uiVisible,
        "A hidden sequence ending the scene should keep the UI hidden"
    );
    assert(
        !uiInteractive,
        "A hidden sequence ending the scene should keep input blocked"
    );
    assertEqual(
        completionStates.join(","),
        "false,false,true,true",
        "Sequence completion should report whether endScene ran"
    );

    console.log("Scripted sequence functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
