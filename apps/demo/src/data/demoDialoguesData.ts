import type { DialogueData } from "@uae/engine";

export const demoDialoguesData: readonly DialogueData[] = [
    {
        id: "fede-sunglasses",
        player: {
            id: "franco",
            name: "Franco"
        },
        npc: {
            id: "fede",
            name: "Fede"
        },
        options: [
            {
                id: "ask-for-calculator",
                playerLine: "¿Me prestás la calculadora?",
                npcLine: "Sí. Tomá.",
                playerClosingLine: "Gracias.",
                endsConversation: true,
                conditions: [
                    {
                        type: "hasItem",
                        itemId: "calculator",
                        value: false
                    }
                ],
                effects: [
                    {
                        type: "giveItem",
                        itemId: "calculator"
                    }
                ]
            },
            {
                id: "ask-how-to-use-calculator",
                playerLine: "¿Cómo se usa esta maravilla?",
                conditions: [
                    {
                        type: "hasItem",
                        itemId: "calculator",
                        value: true
                    }
                ]
            },
            {
                id: "ask-about-sunglasses",
                playerLine: "¿Vos te comprarías esos anteojos?",
                npcLine: "Claro que sí. Salvo que no."
            },
            {
                id: "leave",
                playerLine: "Ahora vuelvo.",
                endsConversation: true
            }
        ]
    },
    {
        id: "gon-sunglasses",
        player: {
            id: "franco",
            name: "Franco"
        },
        npc: {
            id: "gon",
            name: "Gon"
        },
        options: [
            {
                id: "ask-exchange-rate",
                playerLine: "¿Cuál es la cotización de la corona danesa?",
                npcLine: "1 dólar está 7,43 coronas danesas.",
                endsConversation: true,
                effects: [
                    {
                        type: "setState",
                        key: "exchange-rate-known",
                        value: true
                    },
                    {
                        type: "setState",
                        key: "dkk-per-usd",
                        value: 7.43
                    }
                ]
            },
            {
                id: "hello-hello",
                playerLine: "¿Hoy no hay ningún “hello, hello”?",
                npcLine: "I AM REALLY!"
            },
            {
                id: "leave",
                playerLine: "Voy a mirar los anteojos.",
                endsConversation: true
            }
        ]
    }
];
