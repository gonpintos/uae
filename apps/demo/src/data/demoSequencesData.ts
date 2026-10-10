import type { ActionSequenceData } from "@uae/engine";

export const demoSequencesData: readonly ActionSequenceData[] = [
    {
        id: "opening-sunglasses",
        actions: [
            {
                type: "say",
                actorId: "franco",
                message: "¡Necesito comprarme anteojos de sol!"
            }
        ]
    },
    {
        id: "buy-sunglasses",
        actions: [
            {
                type: "moveTo",
                actorId: "franco",
                x: 536,
                y: 610,
                durationMs: 720
            },
            {
                type: "wait",
                durationMs: 3000
            },
            {
                type: "say",
                actorId: "franco",
                message: "¡Listo! Tengo mis anteojos."
            },
            {
                type: "moveBySteps",
                actorId: "franco",
                steps: 5,
                deltaX: 40,
                deltaY: 0,
                stepDurationMs: 180
            },
            {
                type: "wait",
                durationMs: 3000
            },
            {
                type: "say",
                actorId: "franco",
                message: "¡Uy! ¿Dónde están mis anteojos?"
            },
            {
                type: "showTitle",
                text: "CONTINUARÁ"
            },
            {
                type: "endScene"
            }
        ]
    }
];
