import { RenderLayer, type RoomData } from "@uae/engine";
import {
    demoInteractionPositions,
    demoWalkableArea
} from "./demoRoomGeometry";

export const demoRoomData: RoomData = {
    id: "demo-room",
    name: "Demo Room",
    walkableArea: demoWalkableArea,
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
            y: 266,
            width: 440,
            height: 264,
            imageAssetId: "sunglasses-stand",
            depthY: 527
        }
    ],
    hotspots: [
        {
            id: "sunglasses-stand",
            name: "Tienda de anteojos",
            x: 40,
            y: 266,
            width: 440,
            height: 264,
            interactionPosition: demoInteractionPositions["sunglasses-stand"]
        },
        {
            id: "fede",
            name: "Fede",
            actorId: "fede",
            x: 800,
            y: 253,
            width: 150,
            height: 272,
            interactionPosition: demoInteractionPositions.fede
        },
        {
            id: "gon",
            name: "Gon",
            actorId: "gon",
            x: 1000,
            y: 253,
            width: 150,
            height: 272,
            interactionPosition: demoInteractionPositions.gon
        }
    ]
};
