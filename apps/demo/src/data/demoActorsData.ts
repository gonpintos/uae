import type { ActorData } from "@uae/engine";

export const demoActorsData: readonly ActorData[] = [
    {
        id: "franco",
        name: "Franco",
        x: 560,
        y: 338,
        width: 192,
        height: 272,
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
        x: 760,
        y: 338,
        width: 192,
        height: 272,
        animations: {
            idle: {
                frameAssetIds: ["fede-idle"]
            }
        }
    },
    {
        id: "gon",
        name: "Gon",
        x: 960,
        y: 338,
        width: 192,
        height: 272,
        animations: {
            idle: {
                frameAssetIds: ["gon-idle"]
            }
        }
    }
];
