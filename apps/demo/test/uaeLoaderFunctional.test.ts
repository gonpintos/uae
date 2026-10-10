import {
    DialogueCollection,
    DialogueSession,
    GameState,
    Inventory,
    InventoryItemCatalog,
    SceneEntryRegistry,
    UaeContentError,
    UaeGameLoader,
    type UaeLoadedGame
} from "../../../packages/engine/src/index";

declare const require: (id: string) => unknown;
declare const process: {cwd(): string};

const fs = require("node:fs") as {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: "utf8"): string;
};
const path = require("node:path") as {
    resolve(...parts: string[]): string;
};

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`${message}. Expected ${String(expected)}, got ${String(actual)}`);
    }
}

function assertContentError(
    action: () => unknown,
    expectedParts: readonly string[]
): void {
    try {
        action();
    } catch (error: unknown) {
        assert(error instanceof UaeContentError, "Expected UaeContentError");
        for (const part of expectedParts) {
            assert(
                error.message.includes(part),
                `Expected error to include '${part}', received '${error.message}'`
            );
        }
        return;
    }

    throw new Error(`Expected content error containing: ${expectedParts.join(", ")}`);
}

const repositoryRoot = path.resolve(process.cwd(), "../..");
const manifestFileName = "game/content/game.uae.yaml";
const sceneFileName = "game/content/scenes/los-anteojos-de-franco.uae.yaml";
const manifestText = fs.readFileSync(
    path.resolve(repositoryRoot, manifestFileName),
    "utf8"
);
const sceneText = fs.readFileSync(
    path.resolve(repositoryRoot, sceneFileName),
    "utf8"
);

function load(
    manifest = manifestText,
    scene = sceneText
): UaeLoadedGame {
    return new UaeGameLoader().load({
        manifest: {fileName: manifestFileName, text: manifest},
        scenes: {
            "./scenes/los-anteojos-de-franco.uae.yaml": {
                fileName: sceneFileName,
                text: scene
            }
        }
    });
}

const loaded = load();

assertEqual(loaded.id, "uae-demo", "A valid manifest should load");
assertEqual(
    loaded.initialScene.id,
    "los-anteojos-de-franco",
    "A valid scene should load"
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "dialogue: gon-sunglasses",
        "dialogue: missing-dialogue"
    )),
    [sceneFileName, ".action.dialogue", "missing-dialogue"]
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "value: 7.43",
        "value: invalid-number"
    )),
    [sceneFileName, ".value", "expects number"]
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "asset: sunglasses-stand",
        "asset: missing-stand-asset"
    )),
    [sceneFileName, ".visual.asset", "missing-stand-asset"]
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "npc: fede",
        "npc: missing-actor"
    )),
    [sceneFileName, ".npc", "missing-actor"]
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "actor: franco\n        text: \"¡Necesito",
        "actor: missing-actor\n        text: \"¡Necesito"
    )),
    [sceneFileName, ".actions[0].actor", "missing-actor"]
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "verb: look\n    target: sunglasses-stand",
        "verb: missingVerb\n    target: sunglasses-stand"
    )),
    [sceneFileName, ".verb", "missingVerb"]
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "item: calculator\n                value: false",
        "item: missing-item\n                value: false"
    )),
    [sceneFileName, ".item", "missing-item"]
);

assertContentError(
    () => load(manifestText, sceneText.replace(
        "ui: hidden",
        "ui: dimmed"
    )),
    [sceneFileName, ".ui", 'expected "hidden"']
);

assertEqual(
    loaded.requiredAssetIds.length,
    11,
    "Asset closure should include every transitively referenced demo asset"
);
assert(
    loaded.requiredAssetIds.includes("intro-presentation") &&
        loaded.requiredAssetIds.includes("calculator-icon") &&
        loaded.requiredAssetIds.includes("franco-walk-04"),
    "Asset closure should include intro, reachable inventory, and animation assets"
);
assertEqual(
    loaded.assets["calculator-icon"],
    "./assets/inventory/calculator.png",
    "Asset paths should resolve through assetBasePath"
);
for (const [assetId, source] of Object.entries(loaded.assets)) {
    const physicalPath = path.resolve(
        repositoryRoot,
        "apps/demo/public",
        source.replace(/^\.\//, "")
    );
    assert(
        fs.existsSync(physicalPath),
        `Declared asset '${assetId}' should exist at '${physicalPath}'`
    );
}

const entries = new SceneEntryRegistry();
assert(
    entries.shouldRun("scene", "opening", true),
    "A once entry should run on first entry"
);
assert(
    !entries.shouldRun("scene", "opening", true),
    "A once entry should not run twice during the same session"
);
assert(
    entries.shouldRun("scene", "repeatable", false) &&
        entries.shouldRun("scene", "repeatable", false),
    "A repeatable entry should run on every entry"
);

assertEqual(
    loaded.initialScene.actors.length,
    3,
    "The complete scene should adapt all declared actors"
);
assertEqual(
    loaded.initialScene.interactions.length,
    12,
    "The complete scene should adapt all declared interactions"
);
assertEqual(
    loaded.initialScene.dialogues.length,
    2,
    "The complete scene should adapt all declared dialogues"
);
assertEqual(
    loaded.initialScene.sequences.length,
    2,
    "The complete scene should adapt all declared sequences"
);
assertEqual(
    loaded.initialScene.sequences.find(
        (sequence) => sequence.id === "buy-sunglasses"
    )?.ui,
    "hidden",
    "The sequence UI policy should reach runtime data"
);
assertEqual(
    loaded.items[0]?.name,
    "Calculadora",
    "The global item catalog should adapt displayName to runtime name"
);

const franco = loaded.initialScene.actors.find((actor) => actor.id === "franco");
assert(franco, "Franco should be present in adapted actors");
assertEqual(franco.x, 656, "Actor foot anchor should be preserved");
assertEqual(franco.animations?.walk?.frameAssetIds.length, 4, "Walk animation should preserve all frames");

const room = loaded.initialScene.rooms[0];
assert(room, "The adapted scene should contain its room");
assertEqual(room.visuals.length, 2, "Room background and object visual should be generated");
assertEqual(room.hotspots.length, 3, "Actor and object hotspots should be generated");
assertEqual(
    room.hotspots.find((hotspot) => hotspot.id === "sunglasses-stand")?.defaultVerb,
    "look",
    "Entity default verb should reach the runtime hotspot"
);
assertEqual(
    loaded.initialScene.entry?.sequenceId,
    "opening-sunglasses",
    "Scene entry should adapt to the runtime sequence id"
);
assertEqual(
    loaded.initialScene.entry?.once,
    true,
    "Scene entry once semantics should be preserved"
);
assertEqual(
    loaded.initialState["exchange-rate-known"],
    false,
    "Declared initial state should reach Engine data"
);

const inventory = new Inventory(
    new InventoryItemCatalog(loaded.items),
    ["calculator"]
);
const dialogueSession = new DialogueSession(
    new DialogueCollection(loaded.initialScene.dialogues),
    new GameState(loaded.initialState),
    inventory
);

dialogueSession.start("fede-sunglasses");
const howToOption = dialogueSession.view?.options.find(
    (option) => option.id === "ask-how-to-use-calculator"
);
assert(howToOption, "Adapted node dialogue should expose conditioned options");
const continuingTurn = dialogueSession.selectOption(howToOption.id);
assert(!continuingTurn.ended, "goto should keep the dialogue active");
assert(
    dialogueSession.view?.options.some((option) => option.id === "leave"),
    "goto main should return to the declared dialogue node"
);

const multiNodeSession = new DialogueSession(
    new DialogueCollection([{
        id: "multi-node",
        player: {id: "player", name: "Player"},
        npc: {id: "npc", name: "NPC"},
        startNodeId: "root",
        nodes: [
            {
                id: "root",
                options: [{
                    id: "open-detail",
                    playerLine: "Detalle",
                    gotoNodeId: "detail"
                }]
            },
            {
                id: "detail",
                options: [
                    {
                        id: "return-root",
                        playerLine: "Volver",
                        gotoNodeId: "root"
                    },
                    {
                        id: "finish",
                        playerLine: "Terminar",
                        endsConversation: true
                    }
                ]
            }
        ]
    }]),
    new GameState(),
    new Inventory(new InventoryItemCatalog([]))
);

multiNodeSession.start("multi-node");
const detailTurn = multiNodeSession.selectOption("open-detail");
assert(!detailTurn.ended, "A goto between nodes should keep the dialogue active");
assert(
    multiNodeSession.view?.options.some((option) => option.id === "return-root"),
    "A goto should expose the destination node"
);
multiNodeSession.selectOption("return-root");
assert(
    multiNodeSession.view?.options.some((option) => option.id === "open-detail"),
    "A dialogue should be able to return to a prior node"
);
multiNodeSession.selectOption("open-detail");
const finalTurn = multiNodeSession.selectOption("finish");
assert(finalTurn.ended && multiNodeSession.view === null, "An end option should close a multi-node dialogue");

console.log("UAE Loader functional test passed.");
