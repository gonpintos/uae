import type { ActorData } from "@uae/engine";

export const demoActorsData: readonly ActorData[] = [
    {
        id: "franco",
        name: "Franco",
        x: 656,
        y: 610,
        width: 192,
        height: 272,
        speechColor: "#fff3a6",
        walkSpeedPixelsPerSecond: 250,
        initialFacing: "right",
        animations: {
            sourceFacing: "right",
            idle: {
                frameAssetIds: ["franco-idle"]
            },
            walk: {
                frameAssetIds: [
                    "franco-walk-01",
                    "franco-walk-02",
                    "franco-walk-03",
                    "franco-walk-04"
                ],
                frameDurationMs: 180
            }
        }
    },
    {
        id: "fede",
        name: "Fede",
        x: 856,
        y: 610,
        width: 192,
        height: 272,
        speechColor: "#d8b4fe",
        initialFacing: "left",
        animations: {
            sourceFacing: "right",
            idle: {
                frameAssetIds: ["fede-idle"]
            }
        }
    },
    {
        id: "gon",
        name: "Gon",
        x: 1056,
        y: 610,
        width: 192,
        height: 272,
        speechColor: "#9fe8ff",
        initialFacing: "left",
        animations: {
            sourceFacing: "right",
            idle: {
                frameAssetIds: ["gon-idle"]
            }
        }
    }
];
