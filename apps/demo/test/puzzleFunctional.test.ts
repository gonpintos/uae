import { DialogueCollection } from "../../../packages/engine/src/dialogue/DialogueCollection";
import { DialogueSession } from "../../../packages/engine/src/dialogue/DialogueSession";
import { InteractionExecutor } from "../../../packages/engine/src/interaction/InteractionExecutor";
import { VerbInteractionCollection } from "../../../packages/engine/src/interaction/VerbInteractionCollection";
import { Inventory } from "../../../packages/engine/src/inventory/Inventory";
import { InventoryItemCatalog } from "../../../packages/engine/src/inventory/InventoryItemCatalog";
import { RoomCollection } from "../../../packages/engine/src/room/RoomCollection";
import { RoomManager } from "../../../packages/engine/src/room/RoomManager";
import { GameState } from "../../../packages/engine/src/state/GameState";
import { demoDialoguesData } from "../src/data/demoDialoguesData";
import { demoInteractionsData } from "../src/data/demoInteractionsData";
import { demoItemsData } from "../src/data/demoItemsData";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function createRuntime() {
    const state = new GameState();
    const inventory = new Inventory(
        new InventoryItemCatalog(demoItemsData),
        ["calculator"]
    );
    const rooms = new RoomCollection([
        {
            id: "demo-room",
            name: "Demo Room",
            visuals: [],
            hotspots: []
        }
    ]);

    return {
        state,
        inventory,
        dialogue: new DialogueSession(
            new DialogueCollection(demoDialoguesData),
            state,
            inventory
        ),
        interactions: new InteractionExecutor(
            new RoomManager(rooms, "demo-room"),
            new VerbInteractionCollection(demoInteractionsData),
            state,
            inventory
        )
    };
}

function learnExchangeRate(runtime: ReturnType<typeof createRuntime>): void {
    runtime.dialogue.start("gon-sunglasses");

    const response = runtime.dialogue.selectOption("ask-exchange-rate");

    assert(
        response.turn.npcLine === "1 dólar está 7,43 coronas danesas.",
        "Gon should provide the exchange rate."
    );
    assert(
        runtime.state.getFlag("exchange-rate-known"),
        "Gon's response should mark the exchange rate as known."
    );
    assert(
        runtime.state.getValue("dkk-per-usd") === 7.43,
        "Gon's response should store the numeric exchange rate."
    );
}

function learnPrice(runtime: ReturnType<typeof createRuntime>): void {
    const response = runtime.interactions.execute(
        "look",
        "sunglasses-stand"
    );

    assert(
        response.type === "say" &&
            response.message === "¡Uh, acá venden anteojos!\n75 coronas danesas.",
        "Looking at the stand should show and remember its price."
    );
    assert(
        runtime.state.getFlag("sunglasses-price-known"),
        "Looking at the stand should mark the price as known."
    );
    assert(
        runtime.state.getValue("sunglasses-price-dkk") === 75,
        "Looking at the stand should store its DKK price."
    );
}

function calculate(runtime: ReturnType<typeof createRuntime>): void {
    const response = runtime.interactions.execute("use", "calculator");

    assert(
        response.type === "say" &&
            response.message ===
                "¡Diez pesos! Están baratos. Me los compro.",
        "Using the calculator with both inputs should show the result."
    );
    assert(
        runtime.state.getFlag("sunglasses-price-calculated"),
        "A successful calculation should be remembered."
    );
}

const missingBoth = createRuntime();
const missingBothResponse = missingBoth.interactions.execute(
    "use",
    "calculator"
);

assert(
    missingBothResponse.type === "say" &&
        missingBothResponse.message ===
            "No tengo la cotización de la corona danesa.",
    "Missing exchange rate should take priority when both inputs are absent."
);

const priceFirst = createRuntime();
learnPrice(priceFirst);

const priceOnlyResponse = priceFirst.interactions.execute(
    "use",
    "calculator"
);

assert(
    priceOnlyResponse.type === "say" &&
        priceOnlyResponse.message ===
            "No tengo la cotización de la corona danesa.",
    "Knowing only the price should still report the missing exchange rate."
);

learnExchangeRate(priceFirst);
calculate(priceFirst);

const calculatedLook = priceFirst.interactions.execute(
    "look",
    "sunglasses-stand"
);

assert(
    calculatedLook.type === "say" &&
        calculatedLook.message === "¡Ya puedo comprar los anteojos!",
    "Looking at the stand after calculating should use the completed response."
);

const purchaseReady = priceFirst.interactions.execute(
    "goTo",
    "sunglasses-stand"
);

assert(
    purchaseReady.type === "triggerAction" &&
        purchaseReady.actionId === "buy-sunglasses",
    "Going to the stand after calculating should expose the generic purchase action."
);

const rateFirst = createRuntime();
learnExchangeRate(rateFirst);

const rateOnlyResponse = rateFirst.interactions.execute(
    "use",
    "calculator"
);

assert(
    rateOnlyResponse.type === "say" &&
        rateOnlyResponse.message === "No tengo el precio de los anteojos.",
    "Knowing only the exchange rate should report the missing price."
);

const blockedPurchase = rateFirst.interactions.execute(
    "goTo",
    "sunglasses-stand"
);

assert(
    blockedPurchase.type === "say" &&
        blockedPurchase.message ===
            "Primero quiero saber cuánto salen en pesos.",
    "The stand should remain blocked before calculating."
);

learnPrice(rateFirst);
calculate(rateFirst);

console.log("Sunglasses price puzzle functional test passed.");
