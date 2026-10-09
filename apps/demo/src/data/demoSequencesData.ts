import type { ActionSequenceData } from "@uae/engine";

export const demoSequencesData: readonly ActionSequenceData[] = [
    {
        id: "buy-sunglasses",
        actions: [
            {
                type: "moveTo",
                actorId: "franco",
                x: 210,
                y: 280
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
                type: "say",
                actorId: "franco",
                message: "¡Uy! ¿Dónde están mis anteojos?"
            },
            {
                type: "endScene"
            }
        ]
    }
];
