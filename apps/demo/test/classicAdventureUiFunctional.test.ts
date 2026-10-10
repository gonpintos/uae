import { AssetCatalog } from "../../../packages/engine/src/assets/AssetCatalog";
import { RenderLayer } from "../../../packages/engine/src/graphics/RenderLayer";
import type {
    ImageOptions,
    RectangleOptions,
    Renderer,
    TextOptions
} from "../../../packages/engine/src/graphics/Renderer";
import { BrowserInputManager } from "../../../packages/engine/src/input/BrowserInputManager";
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
import { demoAssets } from "../src/assets/demoAssets";
import { demoItemsData } from "../src/data/demoItemsData";

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
const layout = new GameLayout({interfaceHeight: 110});
const gameViewport = layout.getGameViewport(renderer);
const interfaceBounds = layout.getInterfaceBounds(renderer);

assertEqual(gameViewport.height, 610, "The gameplay area should stop above the fixed UI");
assertEqual(interfaceBounds.y, 610, "The classic UI should stay fixed at the bottom");
assertEqual(interfaceBounds.height, 110, "The classic UI should use its configured height");
assertEqual(
    JSON.stringify(new DialoguePanel().getBounds(renderer)),
    JSON.stringify(interfaceBounds),
    "DialoguePanel should use exactly the same fixed lower bounds"
);

const inventory = new Inventory(
    new InventoryItemCatalog(demoItemsData),
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
    new AssetCatalog(demoAssets)
);

assert(
    texts.some((entry) => entry.text === "Hablar con Fede"),
    "Hovering Fede should build the action line from verb and target data"
);
assert(
    images.some((entry) => entry.source === "/assets/inventory/calculator.png"),
    "The fixed inventory should keep the calculator image"
);

const useVerb = ui.findVerbAt({x: 400, y: 675});
const calculator = ui.findItemAt({x: 900, y: 675});

assertEqual(useVerb, "use", "The Use verb should remain selectable in the fixed UI");
assertEqual(calculator, "calculator", "Inventory items should remain selectable in the fixed UI");
assert(ui.contains({x: 900, y: 675}), "The lower panel should consume UI clicks");
assert(
    !containsPoint(gameViewport, {x: 900, y: 675}),
    "A UI click should never be inside the gameplay viewport"
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

texts.length = 0;
new InventoryPanel().draw(renderer, []);
assert(
    !texts.some(
        (entry) => entry.text === "Inventario" || entry.text === "(vacío)"
    ),
    "An empty inventory should not render labels or placeholder text"
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

type Listener = (event: {clientX: number; clientY: number}) => void;
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
input.destroy();
assertEqual(fakeTarget.style.cursor, "", "The normal cursor should be restored after leaving the game input lifecycle");

console.log("Classic adventure UI and cursor functional test passed.");
