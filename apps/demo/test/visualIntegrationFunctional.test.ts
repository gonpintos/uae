import { ActorAssetCollector } from "../../../packages/engine/src/actor/ActorAssetCollector";
import { ActorCollection } from "../../../packages/engine/src/actor/ActorCollection";
import { ActorRenderer } from "../../../packages/engine/src/actor/ActorRenderer";
import { AssetCatalog } from "../../../packages/engine/src/assets/AssetCatalog";
import type { ImageOptions, Renderer } from "../../../packages/engine/src/graphics/Renderer";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryAssetCollector } from "../../../packages/engine/src/inventory/InventoryAssetCollector";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { InventoryPanel } from "../../../packages/engine/src/ui/InventoryPanel";
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
            image.source === "/assets/actors/franco/idle.png" &&
            image.flipHorizontal === false
    ),
    "ActorRenderer should draw Franco's declared idle asset"
);
assert(
    drawnImages.some((image) => image.source === "/assets/actors/fede.png"),
    "ActorRenderer should draw Fede's real asset"
);
assert(
    drawnImages.some((image) => image.source === "/assets/actors/gon.png"),
    "ActorRenderer should draw Gon's real asset"
);

drawnImages.length = 0;

const franco = actors.getById("franco");

franco.startMovement(-1);
actorRenderer.draw(renderer, actors, assets);

assert(
    drawnImages.some(
        (image) =>
            image.source === "/assets/actors/franco/walk-01.png" &&
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
            image.source === "/assets/inventory/calculator.png" &&
            image.width === 32 &&
            image.height === 48
    ),
    "InventoryPanel should draw the calculator's declared image"
);

console.log("Visual integration functional test passed.");
