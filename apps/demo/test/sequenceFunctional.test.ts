import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { ActionSequenceCollection } from "../../../packages/engine/src/sequence/ActionSequenceCollection";
import { ActionSequenceRunner } from "../../../packages/engine/src/sequence/ActionSequenceRunner";
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
    const actorStates: Array<{
        x: number;
        y: number;
        animation: string;
        frameAssetId: string | null;
        facing: string;
        flipped: boolean;
    }> = [];
    let sceneEnded = false;

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
            },
            onSay: (actor, message) => {
                events.push(`say:${actor.name}:${message}`);
            },
            onEndScene: () => {
                sceneEnded = true;
                events.push("end");
            }
        },
        (durationMs) => {
            delays.push(durationMs);
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
    assert(sceneEnded, "The sequence should end the scene");
    assertEqual(
        delays.join(","),
        "180,180,180,180,3000,180,180,180,180,180",
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
                state.x === 440 &&
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

    assertEqual(franco.x, 640, "Franco should finish five steps away from the stand");
    assertEqual(franco.y, 338, "Franco should preserve his vertical position while walking away");
    assertEqual(franco.currentAnimation, "idle", "Franco should return to idle after walking");
    assertEqual(franco.currentFrameAssetId, "franco-idle", "Idle should restore its declared asset");
    assertEqual(franco.facing, "right", "Franco should finish facing his movement direction");
    assert(!franco.flipHorizontal, "Rightward movement should restore the original art direction");

    console.log("Scripted sequence functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
