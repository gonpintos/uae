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
rectangles.length = 0;
images.length = 0;
ui.draw(
    renderer,
    interfaceBounds,
    {
        selectedVerb: "goTo",
        targetName: null,
        items: inventory.items,
        visible: false,
        interactive: false
    },
    new AssetCatalog(contentAssets)
);
assert(!ui.isVisible, "A hidden sequence policy should hide the classic UI");
assert(!ui.isInteractive, "A hidden classic UI should never accept input");
assertEqual(texts.length, 0, "A hidden classic UI should draw no text");
assertEqual(rectangles.length, 0, "A hidden classic UI should draw no panels");
assertEqual(images.length, 0, "A hidden classic UI should draw no inventory icons");
assert(
    !ui.contains({x: 900, y: 675}),
    "A hidden classic UI should expose no interactive bounds"
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
const pressedPositions: Point[] = [];
const unsubscribeDown = input.onPointerDown((position, button) => {
    pressedButtons.push(button);
    pressedPositions.push(position);
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
assert(
    pressedPositions.every(
        (position) => position.x === 100 && position.y === 50
    ),
    "Primary and secondary clicks should retain the logical cursor hotspot"
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
let cursorTime = 0;
let scheduledFrame: (() => void) | null = null;
let scheduledInterval = 0;
let schedulerStopped = false;
let animationFrames = 0;
const gameCursor = new GameCursor({
    clock: () => cursorTime,
    scheduler: (callback, intervalMs) => {
        scheduledFrame = callback;
        scheduledInterval = intervalMs;

        return () => {
            schedulerStopped = true;
        };
    }
});
const stopCursorAnimation = gameCursor.startAnimation(() => {
    animationFrames += 1;
});

assertEqual(scheduledInterval, 110, "The default contrast step should last 110 ms");
(scheduledFrame as (() => void) | null)?.();
assertEqual(animationFrames, 1, "The cursor scheduler should request a new frame");
stopCursorAnimation();
assert(schedulerStopped, "Stopping cursor animation should release its scheduler");

gameCursor.draw(renderer, pointerState.value ?? {x: 0, y: 0});

assertEqual(rectangles.length, 4, "The crosshair should use four generated rectangles");
assertEqual(gameCursor.size, 25, "The crosshair should be 25 logical pixels wide and high");
assertEqual(gameCursor.hotspotOffset, 12, "Pixel 12,12 should be the crosshair hotspot");
const cursorMinX = Math.min(...rectangles.map((entry) => entry.x));
const cursorMinY = Math.min(...rectangles.map((entry) => entry.y));
const cursorMaxX = Math.max(...rectangles.map((entry) => entry.x + entry.width));
const cursorMaxY = Math.max(...rectangles.map((entry) => entry.y + entry.height));

assertEqual(cursorMaxX - cursorMinX, 25, "The crosshair bounds should be 25 pixels wide");
assertEqual(cursorMaxY - cursorMinY, 25, "The crosshair bounds should be 25 pixels high");
assertEqual(cursorMinX + gameCursor.hotspotOffset, 100, "The visual center should match click x");
assertEqual(cursorMinY + gameCursor.hotspotOffset, 50, "The visual center should match click y");
assert(
    rectangles.every((entry) =>
        Number.isInteger(entry.x) &&
        Number.isInteger(entry.y) &&
        Number.isInteger(entry.width) &&
        Number.isInteger(entry.height)
    ),
    "Every crosshair edge should use integer logical coordinates"
);
assertEqual(
    rectangles.filter((entry) => entry.width === 3 && entry.height === 9).length,
    2,
    "The crosshair should have equal upper and lower arms"
);
assertEqual(
    rectangles.filter((entry) => entry.width === 9 && entry.height === 3).length,
    2,
    "The crosshair should have equal left and right arms"
);
assert(
    rectangles.every((entry) => entry.color === "#ffffff"),
    "The cursor contrast cycle should begin in white"
);
assert(
    rectangles.every((entry) => entry.pixelPerfect === true),
    "Every crosshair primitive should request pixel-perfect rendering"
);
assert(
    Array.from({length: 7}, (_, yOffset) =>
        Array.from({length: 7}, (_, xOffset) => ({
            x: 97 + xOffset,
            y: 47 + yOffset
        }))
    ).flat().every((point) =>
        !rectangles.some((entry) =>
            point.x >= entry.x &&
            point.x < entry.x + entry.width &&
            point.y >= entry.y &&
            point.y < entry.y + entry.height
        )
    ),
    "The 7 by 7 area around the click hotspot should remain transparent"
);
assert(
    !rectangles.some((entry) =>
        100 >= entry.x &&
        100 < entry.x + entry.width &&
        50 >= entry.y &&
        50 < entry.y + entry.height
    ),
    "The exact click hotspot should remain transparent"
);
assert(
    rectangles.every((entry) => entry.layer === RenderLayer.Cursor),
    "Every cursor pixel should render on the top cursor layer"
);
assert(
    RenderLayer.Cursor > RenderLayer.Modal &&
        RenderLayer.Cursor > RenderLayer.Speech,
    "The cursor layer should remain above modal UI and speech"
);

const expectedCursorColors = [
    "#ffffff",
    "#c8c8c8",
    "#777777",
    "#181818",
    "#777777",
    "#c8c8c8",
    "#ffffff"
];
const initialGeometry = rectangles.map(({x, y, width, height}) => ({
    x,
    y,
    width,
    height
}));

for (const [step, expectedColor] of expectedCursorColors.entries()) {
    cursorTime = step * gameCursor.stepDurationMs;
    rectangles.length = 0;
    gameCursor.draw(renderer, {x: 100, y: 50});

    assert(
        rectangles.every((entry) => entry.color === expectedColor),
        `Cursor contrast step ${String(step)} should use ${expectedColor}`
    );
    assertEqual(
        JSON.stringify(rectangles.map(({x, y, width, height}) => ({
            x,
            y,
            width,
            height
        }))),
        JSON.stringify(initialGeometry),
        "Changing contrast must not move or resize the cursor"
    );
}

cursorTime = expectedCursorColors.length * gameCursor.stepDurationMs;
rectangles.length = 0;
gameCursor.draw(renderer, {x: 100, y: 50});
assert(
    rectangles.every((entry) => entry.color === expectedCursorColors[0]),
    "The cursor contrast sequence should repeat cyclically"
);

rectangles.length = 0;
const doubledScaleRenderer = {
    ...renderer,
    getViewportScale: () => 2
} as unknown as Renderer;

gameCursor.draw(doubledScaleRenderer, {x: 100, y: 50});
const scaledMinX = Math.min(...rectangles.map((entry) => entry.x));
const scaledMaxX = Math.max(...rectangles.map((entry) => entry.x + entry.width));
assertEqual(
    scaledMaxX - scaledMinX,
    25,
    "The cursor should remain 25 logical pixels when the canvas scale changes"
);
assert(
    rectangles.every((entry) => entry.pixelPerfect === true),
    "Scaled cursor geometry should continue requesting pixel snapping"
);

unsubscribeMove();
unsubscribeDown();
input.destroy();
assertEqual(fakeTarget.style.cursor, "", "The normal cursor should be restored after leaving the game input lifecycle");

console.log("Classic adventure UI and cursor functional test passed.");
