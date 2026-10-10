import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { ActorMovementController } from "../../../packages/engine/src/actor/ActorMovementController";
import { InteractionFacingController } from "../../../packages/engine/src/actor/InteractionFacingController";
import { Hotspot } from "../../../packages/engine/src/interaction/Hotspot";
import { DialogueCollection } from "../../../packages/engine/src/dialogue/DialogueCollection";
import { DialogueSession } from "../../../packages/engine/src/dialogue/DialogueSession";
import { InteractionExecutor } from "../../../packages/engine/src/interaction/InteractionExecutor";
import { DefaultVerbResolver } from "../../../packages/engine/src/interaction/DefaultVerb";
import { VerbInteractionCollection } from "../../../packages/engine/src/interaction/VerbInteractionCollection";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { NavigationController } from "../../../packages/engine/src/navigation/NavigationController";
import { NavigationDebugRenderer } from "../../../packages/engine/src/debug/NavigationDebugRenderer";
import type {
    LineOptions,
    Renderer,
    TextOptions
} from "../../../packages/engine/src/graphics/Renderer";
import { RoomCollection } from "../../../packages/engine/src/room/RoomCollection";
import { RoomManager } from "../../../packages/engine/src/room/RoomManager";
import { GameState } from "../../../packages/engine/src/state/GameState";
import { demoActorsData } from "../src/data/demoActorsData";
import { demoDialoguesData } from "../src/data/demoDialoguesData";
import { demoInteractionsData } from "../src/data/demoInteractionsData";
import { demoItemsData } from "../src/data/demoItemsData";
import {
    demoInteractionPositions,
    demoWalkableArea
} from "../src/data/demoRoomGeometry";

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
    const actorStates: string[] = [];
    let releaseFirstMovementTick: (() => void) | null = null;
    let shouldHoldMovement = true;
    const movement = new ActorMovementController(
        actors,
        (actor) => {
            actorStates.push(
                `${actor.currentAnimation}:${actor.facing}:${actor.x},${actor.y}`
            );
        },
        () => {
            if (!shouldHoldMovement) {
                return Promise.resolve();
            }

            shouldHoldMovement = false;

            return new Promise((resolve) => {
                releaseFirstMovementTick = resolve;
            });
        }
    );
    const rooms = new RoomCollection([
        {
            id: "navigation-room",
            name: "Navigation Room",
            visuals: [
                {
                    id: "depth-object",
                    x: 40,
                    y: 266,
                    width: 440,
                    height: 264,
                    depthY: 527
                }
            ],
            walkableArea: demoWalkableArea,
            hotspots: [
                {
                    id: "fede",
                    actorId: "fede",
                    x: 800,
                    y: 253,
                    width: 150,
                    height: 272,
                    interactionPosition: demoInteractionPositions.fede,
                    defaultVerb: "talkTo"
                }
            ]
        }
    ]);
    const roomManager = new RoomManager(rooms, "navigation-room");
    const facing = new InteractionFacingController(actors);
    const navigation = new NavigationController(roomManager, movement, facing);
    const state = new GameState();
    const inventory = new Inventory(
        new InventoryItemCatalog(demoItemsData)
    );
    const interactions = new InteractionExecutor(
        roomManager,
        new VerbInteractionCollection(demoInteractionsData),
        state,
        inventory
    );
    const dialogue = new DialogueSession(
        new DialogueCollection(demoDialoguesData),
        state,
        inventory
    );
    const franco = actors.getById("franco");
    const fedeActor = actors.getById("fede");

    fedeActor.faceToward(1200);
    assertEqual(fedeActor.facing, "right", "Fede should start facing the wrong way for this test");
    const fede = roomManager.currentRoom.hotspots.findAt({
        x: 850,
        y: 400
    });

    if (!fede) {
        throw new Error("Fede hotspot should exist.");
    }

    const defaultVerbs = new DefaultVerbResolver(state, inventory);
    const rightClickVerb = defaultVerbs.resolveTarget(
        "secondary",
        "look",
        fede.defaultVerb
    );

    assertEqual(
        rightClickVerb,
        "talkTo",
        "Right-click should resolve the NPC's declared default verb"
    );
    assertEqual(
        defaultVerbs.resolveTarget("primary", "look", fede.defaultVerb),
        "look",
        "Left-click should preserve the currently selected verb"
    );

    assert(
        roomManager.currentRoom.canWalkTo({x: franco.x, y: franco.y}),
        "Franco's foot anchor should start inside the walkable polygon"
    );

    let interactionExecuted = false;
    let interactionPositionX: number | null = null;
    let facingAtInteraction = "";
    const talkRequest = navigation.walkToTarget(
        "franco",
        fede,
        () => {
            interactionExecuted = true;
            interactionPositionX = franco.x;
            facingAtInteraction = `${franco.facing}:${fedeActor.facing}`;

            const result = interactions.execute(rightClickVerb ?? "", fede.id);

            if (result.type !== "startDialogue") {
                throw new Error("talkTo + Fede should resolve to a dialogue.");
            }

            dialogue.start(result.dialogueId);
        }
    );

    assert(navigation.isNavigating, "Navigation should lock input while Franco walks");
    assert(movement.isMoving, "The shared movement controller should be active");
    assertEqual(franco.currentAnimation, "walk", "Target navigation should start walking");
    assertEqual(franco.facing, "right", "Franco should face right when walking to Fede");
    assert(!interactionExecuted, "The target interaction must remain pending before arrival");
    assert(!dialogue.isActive, "Fede's dialogue must not open before Franco arrives");

    const blockedRequest = await navigation.walkToPoint(
        "franco",
        {x: 600, y: 520}
    );

    assert(!blockedRequest, "A second navigation request should be blocked while walking");

    const releaseMovement = releaseFirstMovementTick as (() => void) | null;

    if (!releaseMovement) {
        throw new Error("The first movement tick should be waiting.");
    }

    releaseMovement();

    const reachedFede = await talkRequest;

    assert(reachedFede, "Franco should reach Fede's interaction position");
    assert(interactionExecuted, "The pending interaction should execute after arrival");
    assertEqual(interactionPositionX, 740, "The interaction should run at Fede's declared position");
    assertEqual(
        facingAtInteraction,
        "right:left",
        "Both actors should face each other before the dialogue starts"
    );
    assert(dialogue.isActive, "Fede's dialogue should open after Franco arrives");
    assert(!navigation.isNavigating, "Navigation should unlock after the interaction runs");
    assertEqual(franco.currentAnimation, "idle", "Franco should return to idle at the target");

    dialogue.selectOption("leave");

    const angledOutsideAccepted = await navigation.walkToPoint(
        "franco",
        {x: 30, y: 430}
    );

    assert(
        !angledOutsideAccepted,
        "A point outside the sidewalk polygon should be rejected even inside its bounding box"
    );

    const beforeOutsideClick = {x: franco.x, y: franco.y};
    const outsideAccepted = await navigation.walkToPoint(
        "franco",
        {x: 500, y: 380}
    );

    assert(!outsideAccepted, "A point outside the walkable area should be rejected");
    assertEqual(franco.x, beforeOutsideClick.x, "Rejected navigation should not change x");
    assertEqual(franco.y, beforeOutsideClick.y, "Rejected navigation should not change y");

    const floorAccepted = await navigation.walkToPoint(
        "franco",
        {x: 500, y: 520}
    );

    assert(floorAccepted, "goTo + walkable point should start navigation");
    assertEqual(franco.x, 500, "Walk-to-click should finish at the clicked x anchor");
    assertEqual(franco.y, 520, "Walk-to-click should finish at the clicked ground anchor");
    assertEqual(franco.currentAnimation, "idle", "Walk-to-click should finish idle");
    assertEqual(franco.facing, "left", "Walking to a point on the left should update direction");
    assert(franco.flipHorizontal, "Leftward walking should flip the right-facing art");
    assert(
        actorStates.some((entry) => entry.startsWith("walk:right:")) &&
            actorStates.some((entry) => entry.startsWith("walk:left:")) &&
            actorStates.some((entry) => entry.startsWith("idle:left:")),
        "Navigation should cover right/left walk states and restore idle"
    );

    const reverseActors = new ActorCollection([
        {
            id: "player",
            name: "Player",
            x: 900,
            y: 600,
            width: 100,
            height: 200,
            initialFacing: "right"
        },
        {
            id: "npc",
            name: "NPC",
            x: 700,
            y: 600,
            width: 100,
            height: 200,
            initialFacing: "left"
        }
    ]);
    const reverseFacing = new InteractionFacingController(reverseActors);

    reverseFacing.faceInteraction(
        "player",
        new Hotspot({
            id: "npc-hotspot",
            actorId: "npc",
            x: 650,
            y: 400,
            width: 100,
            height: 200
        })
    );

    assertEqual(
        reverseActors.getById("player").facing,
        "left",
        "The controlled actor should face left when the NPC is to its left"
    );
    assertEqual(
        reverseActors.getById("npc").facing,
        "right",
        "The NPC should face right when the controlled actor is to its right"
    );

    const debugLines: LineOptions[] = [];
    const debugTexts: TextOptions[] = [];
    const debugRenderer = {
        drawLine: (options: LineOptions) => debugLines.push(options),
        drawText: (options: TextOptions) => debugTexts.push(options)
    } as unknown as Renderer;

    new NavigationDebugRenderer().draw(
        debugRenderer,
        roomManager.currentRoom,
        actors,
        "franco"
    );

    assert(
        debugLines.length >= demoWalkableArea.points.length + 5,
        "Explicit navigation debug should draw polygon, anchor, interaction and depth lines"
    );
    assert(
        debugTexts.some((entry) => entry.text.includes("[anchor] franco")) &&
            debugTexts.some((entry) => entry.text.includes("[interaction] fede")) &&
            debugTexts.some((entry) => entry.text.includes("[depthY 527]")),
        "Navigation debug should label generic scene geometry"
    );

    console.log("Navigation functional test passed.");
}

runTest().catch((error: unknown) => {
    console.error(error);
    throw error;
});
