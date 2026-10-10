import { ActorAssetCollector } from "../../../packages/engine/src/actor/ActorAssetCollector";
import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { ActorRenderer } from "../../../packages/engine/src/actor/ActorRenderer";
import { AssetCatalog } from "../../../packages/engine/src/assets/AssetCatalog";
import type { ImageOptions, Renderer } from "../../../packages/engine/src/graphics/Renderer";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryAssetCollector } from "../../../packages/engine/src/inventory/InventoryAssetCollector";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { InventoryPanel } from "../../../packages/engine/src/ui/InventoryPanel";
import { Room } from "../../../packages/engine/src/room/Room";
import { RoomVisualRenderer } from "../../../packages/engine/src/room/RoomVisualRenderer";
import { demoAssets } from "../src/assets/demoAssets";
import { demoActorsData } from "../src/data/demoActorsData";
import { demoItemsData } from "../src/data/demoItemsData";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

const assets = new AssetCatalog(demoAssets);
const drawnImages: ImageOptions[] = [];
const renderer = {
    getSize: () => ({
        width: 1280,
        height: 720
    }),
    drawRectangle: () => undefined,
    drawText: () => undefined,
    drawImage: (options: ImageOptions) => {
        drawnImages.push(options);
    }
} as unknown as Renderer;

const actorAssetIds = new ActorAssetCollector().collect(demoActorsData);

assert(actorAssetIds.length === 7, "All actor animation assets should be collected once");
assert(actorAssetIds.includes("franco-idle"), "Franco's idle asset should be preloaded");
assert(actorAssetIds.includes("fede-idle"), "Fede's idle asset should be preloaded");
assert(actorAssetIds.includes("gon-idle"), "Gon's idle asset should be preloaded");

const actors = new ActorCollection(demoActorsData);
const actorRenderer = new ActorRenderer();

actorRenderer.draw(renderer, actors, assets);

assert(
    drawnImages.some(
        (image) =>
            image.source === "./assets/actors/franco/idle.png" &&
            image.flipHorizontal === false &&
            image.x === 560 &&
            image.y === 338
    ),
    "ActorRenderer should place Franco's sprite relative to his ground anchor"
);
assert(
    drawnImages.some(
        (image) =>
            image.source === "./assets/actors/fede.png" &&
            image.flipHorizontal === true
    ),
    "ActorRenderer should draw Fede facing left"
);
assert(
    drawnImages.some(
        (image) =>
            image.source === "./assets/actors/gon.png" &&
            image.flipHorizontal === true
    ),
    "ActorRenderer should draw Gon facing left"
);

const depthActors = new ActorCollection(demoActorsData);
const depthFranco = depthActors.getById("franco");
const room = new Room({
    id: "depth-room",
    name: "Depth Room",
    walkableArea: {
        type: "polygon",
        points: [
            {x: 0, y: 500},
            {x: 1280, y: 500},
            {x: 1280, y: 650},
            {x: 0, y: 650}
        ]
    },
    visuals: [
        {
            id: "depth-stand",
            x: 40,
            y: 346,
            width: 440,
            height: 264,
            imageAssetId: "sunglasses-stand",
            depthY: 620
        }
    ],
    hotspots: []
});

drawnImages.length = 0;
new RoomVisualRenderer().draw(renderer, room, assets);
actorRenderer.draw(renderer, depthActors, assets);

const standBehindLayer = drawnImages.find(
    (image) => image.source === "./assets/objects/sunglasses-stand.png"
)?.layer ?? 0;
const actorBehindLayer = drawnImages.find(
    (image) => image.source === "./assets/actors/franco/idle.png"
)?.layer ?? 0;

assert(
    actorBehindLayer < standBehindLayer,
    "An actor with a lower foot anchor should render behind the declared object depth"
);

depthFranco.moveTo(depthFranco.x, 630);
drawnImages.length = 0;
new RoomVisualRenderer().draw(renderer, room, assets);
actorRenderer.draw(renderer, depthActors, assets);

const standFrontLayer = drawnImages.find(
    (image) => image.source === "./assets/objects/sunglasses-stand.png"
)?.layer ?? 0;
const actorFrontLayer = drawnImages.find(
    (image) => image.source === "./assets/actors/franco/idle.png"
)?.layer ?? 0;

assert(
    actorFrontLayer > standFrontLayer,
    "An actor with a greater foot anchor should render in front of the object"
);

drawnImages.length = 0;

const franco = actors.getById("franco");

franco.startMovement(-1);
actorRenderer.draw(renderer, actors, assets);

assert(
    drawnImages.some(
        (image) =>
            image.source === "./assets/actors/franco/walk-01.png" &&
            image.flipHorizontal === true
    ),
    "ActorRenderer should flip the walk frame for leftward movement"
);

const inventoryAssetIds = new InventoryAssetCollector().collect(demoItemsData);

assert(
    inventoryAssetIds.length === 1 && inventoryAssetIds[0] === "calculator-icon",
    "The calculator icon should be included in required inventory assets"
);

const inventory = new Inventory(
    new InventoryItemCatalog(demoItemsData),
    ["calculator"]
);

drawnImages.length = 0;

new InventoryPanel().draw(renderer, inventory.items, assets);

assert(
    drawnImages.some(
        (image) =>
            image.source === "./assets/inventory/calculator.png" &&
            image.width === 32 &&
            image.height === 48
    ),
    "InventoryPanel should draw the calculator's declared image"
);

console.log("Visual integration functional test passed.");
