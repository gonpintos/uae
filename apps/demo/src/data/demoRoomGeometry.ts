import type { Point, PolygonWalkableArea } from "@uae/engine";

export const demoGroundY = 525;

export const demoWalkableArea = {
    type: "polygon",
    points: [
        {x: 0, y: 520},
        {x: 90, y: 514},
        {x: 210, y: 506},
        {x: 360, y: 497},
        {x: 520, y: 489},
        {x: 720, y: 482},
        {x: 880, y: 486},
        {x: 1020, y: 497},
        {x: 1180, y: 510},
        {x: 1280, y: 520},
        {x: 1280, y: 529},
        {x: 0, y: 529}
    ]
} satisfies PolygonWalkableArea;

export const demoInteractionPositions: Readonly<Record<string, Point>> = {
    "sunglasses-stand": {x: 536, y: demoGroundY},
    fede: {x: 740, y: demoGroundY},
    gon: {x: 940, y: demoGroundY}
};
