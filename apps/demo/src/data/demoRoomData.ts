import { RenderLayer, type RoomData } from "@uae/engine";

export const demoRoomData: RoomData = {
    id: "demo-room",
    name: "Demo Room",
    walkableArea: {
        type: "polygon",
        points: [
            {x: 20, y: 510},
            {x: 1260, y: 470},
            {x: 1260, y: 610},
            {x: 20, y: 610}
        ]
    },
    visuals: [
        {
            id: "copenhagen-street-background",
            x: 0,
            y: 0,
            width: 1280,
            height: 720,
            imageAssetId: "copenhagen-street",
            layer: RenderLayer.RoomBackground
        },
        {
            id: "sunglasses-stand-visual",
            x: 40,
            y: 346,
            width: 440,
            height: 264,
            imageAssetId: "sunglasses-stand",
            depthY: 620
        }
    ],
    hotspots: [
        {
            id: "sunglasses-stand",
            name: "Tienda de anteojos",
            x: 40,
            y: 346,
            width: 440,
            height: 264,
            interactionPosition: {
                x: 536,
                y: 610
            }
        },
        {
            id: "fede",
            name: "Fede",
            actorId: "fede",
            x: 800,
            y: 338,
            width: 150,
            height: 272,
            interactionPosition: {
                x: 740,
                y: 610
            }
        },
        {
            id: "gon",
            name: "Gon",
            actorId: "gon",
            x: 1000,
            y: 338,
            width: 150,
            height: 272,
            interactionPosition: {
                x: 940,
                y: 610
            }
        }
    ]
};
