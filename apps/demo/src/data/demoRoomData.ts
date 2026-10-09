import { RenderLayer, type RoomData } from "@uae/engine";

export const demoRoomData: RoomData = {
    id: "demo-room",
    name: "Demo Room",
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
            imageAssetId: "sunglasses-stand"
        }
    ],
    hotspots: [
        {
            id: "sunglasses-stand",
            x: 40,
            y: 346,
            width: 440,
            height: 264
        },
        {
            id: "fede",
            x: 800,
            y: 338,
            width: 150,
            height: 272
        },
        {
            id: "gon",
            x: 1000,
            y: 338,
            width: 150,
            height: 272
        }
    ]
};
