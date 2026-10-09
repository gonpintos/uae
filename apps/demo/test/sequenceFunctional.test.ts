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
    let sceneEnded = false;

    const runner = new ActionSequenceRunner(
        sequences,
        actors,
        {
            onActorMoved: (actor) => {
                events.push(`move:${actor.x},${actor.y}`);
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

    const execution = runner.run("buy-sunglasses");

    assert(runner.isRunning, "The runner should lock input while the sequence is active");

    await execution;

    assert(!runner.isRunning, "The runner should release its running state after the sequence");
    assert(sceneEnded, "The sequence should end the scene");
    assertEqual(delays.join(","), "3000,180,180,180,180", "Unexpected sequence delays");
    assertEqual(
        events.join("\n"),
        [
            "move:210,280",
            "say:Franco:¡Listo! Tengo mis anteojos.",
            "move:250,280",
            "move:290,280",
            "move:330,280",
            "move:370,280",
            "move:410,280",
            "say:Franco:¡Uy! ¿Dónde están mis anteojos?",
            "end"
        ].join("\n"),
        "The declarative actions should execute in order"
    );

    const franco = actors.getById("franco");

    assertEqual(franco.x, 410, "Franco should finish five steps away from the stand");
    assertEqual(franco.y, 280, "Franco should preserve his vertical position while walking away");

    console.log("Scripted sequence functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
