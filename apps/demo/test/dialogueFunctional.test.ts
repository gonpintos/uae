import { DialogueCollection } from "../../../packages/engine/src/dialogue/DialogueCollection";
import { DialogueSession } from "../../../packages/engine/src/dialogue/DialogueSession";
import { RenderLayer } from "../../../packages/engine/src/graphics/RenderLayer";
import type { Renderer } from "../../../packages/engine/src/graphics/Renderer";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { GameState } from "../../../packages/engine/src/state/GameState";
import { DialoguePanel } from "../../../packages/engine/src/ui/DialoguePanel";
import { InventoryPanel } from "../../../packages/engine/src/ui/InventoryPanel";
import { demoDialoguesData } from "../src/data/demoDialoguesData";
import { demoItemsData } from "../src/data/demoItemsData";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

const state = new GameState({
    chapter: "copenhagen"
});

const inventory = new Inventory(
    new InventoryItemCatalog(demoItemsData)
);

state.setFlag("intro-seen");
state.setValue("attempts", 1);

assert(state.getFlag("intro-seen"), "GameState should store flags.");
assert(
    state.getValue("chapter") === "copenhagen",
    "GameState should load string values."
);
assert(
    state.getValue("attempts") === 1,
    "GameState should store number values."
);

const session = new DialogueSession(
    new DialogueCollection(demoDialoguesData),
    state,
    inventory
);

const drawnLayers: number[] = [];
const drawnTexts: string[] = [];

const renderer = {
    getSize: () => ({
        width: 1280,
        height: 720
    }),
    drawRectangle: (options: {layer?: number}) => {
        drawnLayers.push(options.layer ?? 0);
    },
    drawText: (options: {layer?: number; text: string}) => {
        drawnLayers.push(options.layer ?? 0);
        drawnTexts.push(options.text);
    }
} as unknown as Renderer;

const panel = new DialoguePanel();

session.start("fede-sunglasses");

const initialFedeView = session.view;

if (!initialFedeView) {
    throw new Error("Fede dialogue should start.");
}

assert(initialFedeView.npc.id === "fede", "Fede dialogue should start.");
assert(
    initialFedeView.options.length === 3,
    "Fede menu should show three options."
);
assert(
    initialFedeView.options.some(
        (option) => option.id === "ask-for-calculator"
    ),
    "The calculator request should be visible before receiving it."
);
assert(
    !initialFedeView.options.some(
        (option) => option.id === "ask-how-to-use-calculator"
    ),
    "The calculator usage question should initially be hidden."
);

panel.draw(renderer, panel.getBounds(renderer), initialFedeView);

assert(
    drawnLayers.every((layer) => layer >= RenderLayer.Modal),
    "Dialogue UI should render entirely on the modal layer."
);

const clickedFedeOption = panel.findOptionAt({
    x: 100,
    y: 530
});

assert(
    clickedFedeOption === "ask-about-sunglasses",
    "Clicking Fede's second option should resolve its declared id."
);

const fedeResponse = session.selectOption(clickedFedeOption ?? "");

assert(!fedeResponse.ended, "A regular response should keep the dialogue open.");
assert(
    fedeResponse.turn.npcLine === "Claro que sí. Salvo que no.",
    "Fede response should be returned."
);
assert(
    session.view?.options.length === 3,
    "The option menu should be available again after Fede responds."
);

const repeatedFedeView = session.view;

if (!repeatedFedeView) {
    throw new Error("Fede menu should remain visible after responding.");
}

panel.draw(renderer, panel.getBounds(renderer), repeatedFedeView);

const clickedFedeExit = panel.findOptionAt({
    x: 100,
    y: 640
});

const fedeExit = session.selectOption(clickedFedeExit ?? "");

assert(fedeExit.ended, "Fede exit option should end the dialogue.");
assert(session.view === null, "Fede dialogue should be closed.");

session.start("fede-sunglasses");

const calculatorFedeView = session.view;

if (!calculatorFedeView) {
    throw new Error("Fede dialogue should restart.");
}

panel.draw(renderer, panel.getBounds(renderer), calculatorFedeView);

const clickedCalculatorOption = panel.findOptionAt({
    x: 100,
    y: 490
});

const calculatorResponse = session.selectOption(
    clickedCalculatorOption ?? ""
);

assert(
    calculatorResponse.ended,
    "Receiving the calculator should end Fede's dialogue."
);
assert(
    calculatorResponse.turn.npcLine === "Sí. Tomá.",
    "Fede should hand over the calculator."
);
assert(
    calculatorResponse.turn.playerClosingLine === "Gracias.",
    "Franco should thank Fede before the dialogue closes."
);
assert(
    inventory.has("calculator"),
    "The calculator option should add the calculator to the inventory."
);
assert(
    state.getValue("calculator-owned") === undefined,
    "Calculator ownership should not be duplicated in GameState."
);
assert(
    session.view === null,
    "Fede dialogue should close after giving the calculator."
);

const inventoryPanel = new InventoryPanel();

inventoryPanel.draw(renderer, inventory.items);

assert(
    drawnTexts.includes("• Calculadora"),
    "The visual inventory should render the acquired calculator."
);

const reopenedSession = new DialogueSession(
    new DialogueCollection(demoDialoguesData),
    state,
    inventory
);

reopenedSession.start("fede-sunglasses");

const ownerFedeView = reopenedSession.view;

if (!ownerFedeView) {
    throw new Error("Fede dialogue should start after receiving the calculator.");
}

assert(
    !ownerFedeView.options.some(
        (option) => option.id === "ask-for-calculator"
    ),
    "The calculator request should disappear after receiving it."
);
assert(
    ownerFedeView.options.some(
        (option) => option.id === "ask-how-to-use-calculator"
    ),
    "The calculator usage question should appear after receiving it."
);

reopenedSession.selectOption("leave");

assert(
    inventory.has("calculator"),
    "The calculator should remain owned after closing the reopened dialogue."
);

session.start("gon-sunglasses");

const initialGonView = session.view;

if (!initialGonView) {
    throw new Error("Gon dialogue should start.");
}

panel.draw(renderer, panel.getBounds(renderer), initialGonView);

const clickedGonOption = panel.findOptionAt({
    x: 100,
    y: 490
});

const gonResponse = session.selectOption(clickedGonOption ?? "");

assert(
    gonResponse.ended,
    "Receiving the exchange rate should end Gon's dialogue."
);
assert(
    gonResponse.turn.npcLine === "1 dólar está 7,43 coronas danesas.",
    "Gon response should be returned."
);
assert(
    !session.isActive,
    "Gon dialogue should close after giving the exchange rate."
);

console.log("Dialogue and inventory functional test passed.");
