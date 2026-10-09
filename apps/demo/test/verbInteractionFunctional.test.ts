import { RenderLayer } from "../../../packages/engine/src/graphics/RenderLayer";
import type { Renderer } from "../../../packages/engine/src/graphics/Renderer";
import { InteractionExecutor } from "../../../packages/engine/src/interaction/InteractionExecutor";
import { VerbInteractionCollection } from "../../../packages/engine/src/interaction/VerbInteractionCollection";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { RoomCollection } from "../../../packages/engine/src/room/RoomCollection";
import { RoomManager } from "../../../packages/engine/src/room/RoomManager";
import { GameState } from "../../../packages/engine/src/state/GameState";
import { InventoryPanel } from "../../../packages/engine/src/ui/InventoryPanel";
import { VerbPanel } from "../../../packages/engine/src/ui/VerbPanel";
import { demoInteractionsData } from "../src/data/demoInteractionsData";
import { demoItemsData } from "../src/data/demoItemsData";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

const state = new GameState();
const inventory = new Inventory(
    new InventoryItemCatalog(demoItemsData)
);
const rooms = new RoomCollection([
    {
        id: "demo-room",
        name: "Demo Room",
        visuals: [],
        hotspots: []
    }
]);
const executor = new InteractionExecutor(
    new RoomManager(rooms, "demo-room"),
    new VerbInteractionCollection(demoInteractionsData),
    state,
    inventory
);

const standLook = executor.execute("look", "sunglasses-stand");

assert(
    standLook.type === "message" &&
        standLook.message === "¡Uh, acá venden anteojos!\n75 coronas danesas.",
    "Looking at the stand should show its scene response."
);
assert(
    state.getFlag("sunglasses-price-known"),
    "Looking at the stand should remember that Franco knows the price."
);

const gonLook = executor.execute("look", "gon");
const fedeLook = executor.execute("look", "fede");

assert(
    gonLook.type === "message" && gonLook.message === "Muy hello-hello...",
    "Looking at Gon should show his scene response."
);
assert(
    fedeLook.type === "message" && fedeLook.message === "Nada que decir.",
    "Looking at Fede should show his scene response."
);

inventory.add("calculator");

const calculatorLook = executor.execute("look", "calculator");

assert(
    calculatorLook.type === "message" &&
        calculatorLook.message === "¡La mágica!",
    "Looking at the calculator should show its item response."
);

const gonTalk = executor.execute("talkTo", "gon");
const fedeTalk = executor.execute("talkTo", "fede");

assert(
    gonTalk.type === "startDialogue" &&
        gonTalk.dialogueId === "gon-sunglasses",
    "Talking to Gon should start his dialogue."
);
assert(
    fedeTalk.type === "startDialogue" &&
        fedeTalk.dialogueId === "fede-sunglasses",
    "Talking to Fede should start his dialogue."
);

const standGoTo = executor.execute("goTo", "sunglasses-stand");

assert(
    standGoTo.type === "message" &&
        standGoTo.message === "Primero quiero saber cuánto salen en pesos.",
    "Going to the stand should show the temporary blocked response."
);

const drawnLayers: number[] = [];
const renderer = {
    getSize: () => ({
        width: 1280,
        height: 720
    }),
    drawRectangle: (options: {layer?: number}) => {
        drawnLayers.push(options.layer ?? 0);
    },
    drawText: (options: {layer?: number}) => {
        drawnLayers.push(options.layer ?? 0);
    }
} as unknown as Renderer;

const verbPanel = new VerbPanel();
verbPanel.draw(renderer, "look");

const selectedVerb = verbPanel.findVerbAt({
    x: 220,
    y: 550
});

assert(selectedVerb === "use", "The Use button should be clickable.");

const inventoryPanel = new InventoryPanel();
inventoryPanel.draw(renderer, inventory.items);

const selectedItemId = inventoryPanel.findItemAt({
    x: 1040,
    y: 72
});

assert(
    selectedItemId === "calculator",
    "The calculator should be selectable from the inventory."
);

const calculatorUse = executor.execute(
    selectedVerb ?? "look",
    selectedItemId ?? ""
);

assert(
    calculatorUse.type === "message" &&
        calculatorUse.message === "No tengo la cotización de la corona danesa.",
    "Use plus calculator should execute its highest-priority conditional response."
);
assert(
    drawnLayers.every(
        (layer) =>
            layer >= RenderLayer.Interface &&
            layer < RenderLayer.Modal
    ),
    "Verb and inventory controls should stay below modal UI."
);

console.log("Verb interaction functional test passed.");
