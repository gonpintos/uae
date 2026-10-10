import { AssetCatalog } from "../../../packages/engine/src/assets/AssetCatalog";
import { RenderLayer } from "../../../packages/engine/src/graphics/RenderLayer";
import type {
    ImageOptions,
    RectangleOptions,
    Renderer,
    TextOptions
} from "../../../packages/engine/src/graphics/Renderer";
import { BrowserInputManager } from "../../../packages/engine/src/input/BrowserInputManager";
import { defaultEngineConfig } from "../../../packages/engine/src/config/EngineConfig";
import { containsPoint } from "../../../packages/engine/src/interaction/Rectangle";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import type { Point } from "../../../packages/engine/src/math/Point";
import { ClassicAdventureUI } from "../../../packages/engine/src/ui/ClassicAdventureUI";
import { GameCursor } from "../../../packages/engine/src/ui/GameCursor";
import { GameLayout } from "../../../packages/engine/src/ui/GameLayout";
import { DialoguePanel } from "../../../packages/engine/src/ui/DialoguePanel";
import { InventoryPanel } from "../../../packages/engine/src/ui/InventoryPanel";
import { VerbController } from "../../../packages/engine/src/verb/VerbController";
import { contentAssets, contentItems } from "./support/uaeTestContent";

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

const texts: TextOptions[] = [];
const rectangles: RectangleOptions[] = [];
const images: ImageOptions[] = [];
const renderer = {
    getSize: () => ({width: 1280, height: 720}),
    getViewportScale: () => 1,
    drawText: (options: TextOptions) => texts.push(options),
    drawRectangle: (options: RectangleOptions) => rectangles.push(options),
    drawImage: (options: ImageOptions) => images.push(options)
} as unknown as Renderer;
const layout = new GameLayout();
const gameViewport = layout.getGameViewport(renderer);
const interfaceBounds = layout.getInterfaceBounds(renderer);

assertEqual(gameViewport.height, 530, "The gameplay area should use roughly 75% of the screen");
assertEqual(interfaceBounds.y, 530, "The classic UI should stay fixed at the bottom");
assertEqual(interfaceBounds.height, 190, "The classic UI should use the expanded classic height");
assert(
    !defaultEngineConfig.debug.enabled &&
        !defaultEngineConfig.debug.showNavigation,
    "Navigation debug should be disabled by default"
);
assertEqual(
    JSON.stringify(new DialoguePanel().getBounds(renderer)),
    JSON.stringify(interfaceBounds),
    "DialoguePanel should use exactly the same fixed lower bounds"
);

const inventory = new Inventory(
    new InventoryItemCatalog(contentItems),
    ["calculator"]
);
const ui = new ClassicAdventureUI();

ui.draw(
    renderer,
    interfaceBounds,
    {
        selectedVerb: "talkTo",
        targetName: "Fede",
        items: inventory.items
    },
    new AssetCatalog(contentAssets)
);

assert(
    texts.some((entry) => entry.text === "Hablar con Fede"),
    "Hovering Fede should build the action line from verb and target data"
);
assert(
    images.some((entry) => entry.source === "./assets/inventory/calculator.png"),
    "The fixed inventory should keep the calculator image"
);

const useVerb = ui.findVerbAt({x: 180, y: 670});
const calculator = ui.findItemAt({x: 770, y: 620});

assertEqual(useVerb, "use", "The Use verb should remain selectable in the fixed UI");
assertEqual(calculator, "calculator", "Inventory items should remain selectable in the fixed UI");
assert(ui.contains({x: 900, y: 675}), "The lower panel should consume UI clicks");
assert(
    !containsPoint(gameViewport, {x: 900, y: 675}),
    "A UI click should never be inside the gameplay viewport"
);

texts.length = 0;
rectangles.length = 0;
images.length = 0;
ui.draw(
    renderer,
    interfaceBounds,
    {
        selectedVerb: "goTo",
        targetName: null,
        items: inventory.items,
        visible: true,
        interactive: false
    },
    new AssetCatalog(contentAssets)
);

assert(ui.isVisible, "Cinematic UI should remain visible");
assert(!ui.isInteractive, "Cinematic UI should be marked as disabled");
assert(
    texts.some((entry) => entry.text === "Ir a") &&
        !texts.some((entry) => entry.text === "Calculadora"),
    "Disabled UI should render verbs while inventory remains icon-only"
);
assert(
    images.some((entry) => entry.source === "./assets/inventory/calculator.png"),
    "Disabled UI should keep the inventory image visible"
);
assert(
    rectangles.some(
        (entry) =>
            entry.x === interfaceBounds.x &&
            entry.y === interfaceBounds.y &&
            entry.width === interfaceBounds.width &&
            entry.height === interfaceBounds.height &&
            entry.color === "#000000" &&
            entry.alpha === 0.32 &&
            entry.layer === RenderLayer.Interface + 4
    ),
    "Disabled UI should render a subtle dimming overlay"
);
assertEqual(
    ui.findVerbAt({x: 180, y: 670}),
    null,
    "Disabled verbs should not resolve clicks"
);
assertEqual(
    ui.findItemAt({x: 770, y: 620}),
    null,
    "Disabled inventory items should not resolve clicks"
);
assert(
    ui.contains({x: 900, y: 675}),
    "Disabled UI should still consume clicks inside its bounds"
);

let executedUIClicks = 0;

if (
    ui.findVerbAt({x: 180, y: 670}) ||
    ui.findItemAt({x: 770, y: 620})
) {
    executedUIClicks += 1;
}

assertEqual(
    executedUIClicks,
    0,
    "Clicks on disabled cinematic UI should not execute actions"
);

texts.length = 0;
ui.draw(
    renderer,
    interfaceBounds,
    {
        selectedVerb: "look",
        targetName: "Tienda de anteojos",
        items: inventory.items
    }
);
assert(
    texts.some((entry) => entry.text === "Mirar Tienda de anteojos"),
    "Changing the hovered target should update the action line"
);
assert(ui.isInteractive, "A normal UI draw should restore interaction");
assertEqual(
    ui.findVerbAt({x: 180, y: 670}),
    "use",
    "Verbs should accept input again after cinematic lock ends"
);

texts.length = 0;
new InventoryPanel().draw(renderer, []);
assert(
    !texts.some(
        (entry) => entry.text === "Inventario" || entry.text === "(vacío)"
    ),
    "An empty inventory should not render labels or placeholder text"
);

texts.length = 0;
images.length = 0;
new InventoryPanel().draw(
    renderer,
    inventory.items,
    new AssetCatalog(contentAssets),
    {x: 720, y: 574, width: 548, height: 134}
);
assertEqual(texts.length, 0, "Inventory cells should not draw item names or descriptions");
assert(
    images.some((entry) => entry.source === "./assets/inventory/calculator.png"),
    "Inventory cells should primarily render the declared icon"
);

const temporarilyPreviewedVerbs = new VerbController();

temporarilyPreviewedVerbs.select("look");
texts.length = 0;
ui.draw(
    renderer,
    interfaceBounds,
    {
        selectedVerb: temporarilyPreviewedVerbs.selectedVerb,
        displayVerb: "use",
        targetName: "Calculadora",
        items: inventory.items
    },
    new AssetCatalog(contentAssets)
);
assert(
    texts.some((entry) => entry.text === "Usar Calculadora"),
    "Hovering an inventory icon should preview its default verb in ActionLine"
);
assertEqual(
    temporarilyPreviewedVerbs.selectedVerb,
    "look",
    "Inventory hover should not permanently change the selected verb"
);

texts.length = 0;
ui.draw(
    renderer,
    interfaceBounds,
    {
        selectedVerb: temporarilyPreviewedVerbs.selectedVerb,
        targetName: "Calculadora",
        items: inventory.items
    },
    new AssetCatalog(contentAssets)
);
assert(
    texts.some((entry) => entry.text === "Mirar Calculadora"),
    "Leaving inventory hover should restore the previously selected verb"
);

const overflowItems = Array.from({length: 8}, (_, index) => ({
    id: `item-${index + 1}`,
    name: `Item ${index + 1}`,
    defaultVerb: "look"
}));
const pagedInventory = new InventoryPanel();
const inventoryBounds = {x: 720, y: 574, width: 548, height: 134};

texts.length = 0;
pagedInventory.draw(renderer, overflowItems, undefined, inventoryBounds);

assert(
    texts.some((entry) => entry.text === "◀") &&
        texts.some((entry) => entry.text === "▶"),
    "Inventory arrows should appear only when items overflow"
);
assertEqual(
    pagedInventory.pageCount,
    2,
    "Overflow should create multiple inventory pages"
);

const firstVisibleItems = [...pagedInventory.visibleItemIds];
const nextScrollPosition = {x: 1238, y: 640};

assertEqual(
    pagedInventory.findScrollAt(nextScrollPosition),
    "next",
    "The next inventory arrow should consume its own click"
);
assert(
    pagedInventory.scroll("next"),
    "Clicking next should advance the inventory page"
);

pagedInventory.draw(renderer, overflowItems, undefined, inventoryBounds);

assert(
    pagedInventory.visibleItemIds.some(
        (itemId) => !firstVisibleItems.includes(itemId)
    ),
    "Scrolling should change the visible inventory items"
);

const overflowUi = new ClassicAdventureUI();

overflowUi.draw(
    renderer,
    interfaceBounds,
    {
        selectedVerb: "goTo",
        targetName: null,
        items: overflowItems
    }
);
assertEqual(
    overflowUi.findInventoryScrollAt(nextScrollPosition),
    "next",
    "Classic UI should expose inventory scroll controls"
);
assert(
    overflowUi.contains(nextScrollPosition),
    "Inventory scroll clicks should stay inside the UI and never reach the scene"
);

const fittingInventory = new InventoryPanel();

texts.length = 0;
fittingInventory.draw(renderer, overflowItems.slice(0, 6), undefined, inventoryBounds);
assert(
    !texts.some((entry) => entry.text === "◀" || entry.text === "▶") &&
        fittingInventory.pageCount === 1,
    "Inventory arrows should stay hidden while all items fit"
);

const verbs = new VerbController();

assertEqual(verbs.selectedVerb, "goTo", "Go To should be selected by default");

for (const verbId of ["look", "use", "talkTo"]) {
    verbs.select(verbId);
    verbs.completeAction();
    assertEqual(
        verbs.selectedVerb,
        "goTo",
        `${verbId} should return to the configured default after completion`
    );
}

verbs.select("talkTo");
verbs.completeAction();
assertEqual(
    verbs.selectedVerb,
    "goTo",
    "Finishing a conversation should return to the configured default verb"
);

type ListenerEvent = {
    clientX: number;
    clientY: number;
    button?: number;
    preventDefault?: () => void;
};
type Listener = (event: ListenerEvent) => void;
const listeners = new Map<string, Listener>();
const fakeTarget = {
    style: {cursor: "default"},
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.set(type, listener as unknown as Listener);
    },
    removeEventListener: (type: string) => {
        listeners.delete(type);
    }
};
const input = new BrowserInputManager();
const pointerState: {value: Point | null} = {value: null};

input.initialize(
    fakeTarget as unknown as HTMLElement,
    (position) => ({x: position.x / 2, y: position.y / 2})
);
const unsubscribeMove = input.onPointerMove((position) => {
    pointerState.value = position;
});
const pressedButtons: string[] = [];
const unsubscribeDown = input.onPointerDown((_position, button) => {
    pressedButtons.push(button);
});

let secondaryPrevented = false;

listeners.get("pointerdown")?.({
    clientX: 200,
    clientY: 100,
    button: 2,
    preventDefault: () => {
        secondaryPrevented = true;
    }
});
listeners.get("pointerdown")?.({
    clientX: 200,
    clientY: 100,
    button: 0,
    preventDefault: () => undefined
});

assertEqual(
    pressedButtons.join(","),
    "secondary,primary",
    "Browser input should distinguish right and left pointer buttons"
);
assert(secondaryPrevented, "Right-click should suppress the browser's native action");

listeners.get("pointermove")?.({clientX: 200, clientY: 100});

assertEqual(fakeTarget.style.cursor, "none", "The browser cursor should be hidden on the canvas");
assertEqual(pointerState.value?.x, 100, "Pointer movement should use logical x coordinates");
assertEqual(pointerState.value?.y, 50, "Pointer movement should use logical y coordinates");
listeners.get("pointerleave")?.({clientX: 0, clientY: 0});
assertEqual(pointerState.value, null, "The game cursor should hide when leaving the game area");
assertEqual(
    fakeTarget.style.cursor,
    "none",
    "The browser cursor should stay hidden across scene and lower UI while inside the canvas"
);

listeners.get("pointermove")?.({clientX: 200, clientY: 100});

rectangles.length = 0;
new GameCursor().draw(renderer, pointerState.value ?? {x: 0, y: 0});

assert(rectangles.length > 0, "The UAE cursor should draw its own pixel shape");
assertEqual(rectangles[0]?.x, 100, "The cursor hotspot should follow logical x");
assertEqual(rectangles[0]?.y, 50, "The cursor hotspot should follow logical y");
assert(
    rectangles.every((entry) => entry.layer === RenderLayer.Cursor),
    "Every cursor pixel should render on the top cursor layer"
);
assert(
    RenderLayer.Cursor > RenderLayer.Modal &&
        RenderLayer.Cursor > RenderLayer.Speech,
    "The cursor layer should remain above modal UI and speech"
);

rectangles.length = 0;
const doubledScaleRenderer = {
    ...renderer,
    getViewportScale: () => 2
} as unknown as Renderer;

new GameCursor().draw(doubledScaleRenderer, {x: 100, y: 50});
assertEqual(
    (rectangles[0]?.width ?? 0) * 2,
    4,
    "The cursor should keep a constant displayed size when the canvas scale changes"
);

unsubscribeMove();
unsubscribeDown();
input.destroy();
assertEqual(fakeTarget.style.cursor, "", "The normal cursor should be restored after leaving the game input lifecycle");

console.log("Classic adventure UI and cursor functional test passed.");
