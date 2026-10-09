import type { VerbInteractionData } from "@uae/engine";

export const demoInteractionsData: readonly VerbInteractionData[] = [
    {
        verb: "look",
        targetId: "sunglasses-stand",
        conditions: [
            {
                type: "state",
                key: "sunglasses-price-calculated",
                operator: "equals",
                value: true
            }
        ],
        interaction: {
            type: "message",
            message: "¡Ya puedo comprar los anteojos!"
        }
    },
    {
        verb: "look",
        targetId: "sunglasses-stand",
        conditions: [
            {
                type: "state",
                key: "sunglasses-price-calculated",
                operator: "notEquals",
                value: true
            }
        ],
        interaction: {
            type: "message",
            message: "¡Uh, acá venden anteojos!\n75 coronas danesas."
        },
        effects: [
            {
                type: "setState",
                key: "sunglasses-price-known",
                value: true
            },
            {
                type: "setState",
                key: "sunglasses-price-dkk",
                value: 75
            }
        ]
    },
    {
        verb: "look",
        targetId: "gon",
        interaction: {
            type: "message",
            message: "Muy hello-hello..."
        }
    },
    {
        verb: "look",
        targetId: "fede",
        interaction: {
            type: "message",
            message: "Nada que decir."
        }
    },
    {
        verb: "look",
        targetId: "calculator",
        interaction: {
            type: "message",
            message: "¡La mágica!"
        }
    },
    {
        verb: "use",
        targetId: "calculator",
        conditions: [
            {
                type: "state",
                key: "exchange-rate-known",
                operator: "notEquals",
                value: true
            }
        ],
        interaction: {
            type: "message",
            message: "No tengo la cotización de la corona danesa."
        }
    },
    {
        verb: "use",
        targetId: "calculator",
        conditions: [
            {
                type: "state",
                key: "exchange-rate-known",
                operator: "equals",
                value: true
            },
            {
                type: "state",
                key: "sunglasses-price-known",
                operator: "notEquals",
                value: true
            }
        ],
        interaction: {
            type: "message",
            message: "No tengo el precio de los anteojos."
        }
    },
    {
        verb: "use",
        targetId: "calculator",
        conditions: [
            {
                type: "state",
                key: "exchange-rate-known",
                operator: "equals",
                value: true
            },
            {
                type: "state",
                key: "sunglasses-price-known",
                operator: "equals",
                value: true
            }
        ],
        interaction: {
            type: "message",
            message: "10 pesos\nFranco: «¡Diez pesos! Están baratos. Me los compro.»"
        },
        effects: [
            {
                type: "setState",
                key: "sunglasses-price-calculated",
                value: true
            }
        ]
    },
    {
        verb: "talkTo",
        targetId: "gon",
        interaction: {
            type: "startDialogue",
            dialogueId: "gon-sunglasses"
        }
    },
    {
        verb: "talkTo",
        targetId: "fede",
        interaction: {
            type: "startDialogue",
            dialogueId: "fede-sunglasses"
        }
    },
    {
        verb: "goTo",
        targetId: "sunglasses-stand",
        conditions: [
            {
                type: "state",
                key: "sunglasses-price-calculated",
                operator: "notEquals",
                value: true
            }
        ],
        interaction: {
            type: "message",
            message: "Primero quiero saber cuánto salen en pesos."
        }
    },
    {
        verb: "goTo",
        targetId: "sunglasses-stand",
        conditions: [
            {
                type: "state",
                key: "sunglasses-price-calculated",
                operator: "equals",
                value: true
            }
        ],
        interaction: {
            type: "triggerAction",
            actionId: "buy-sunglasses"
        }
    }
];
