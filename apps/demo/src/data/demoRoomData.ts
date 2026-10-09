import { RenderLayer, type RoomData } from "@uae/engine";

export const demoRoomData: RoomData = {
    id: "demo-room",
    name: "Demo Room",
    visuals: [
        {
            id: "floor-visual",

            x: 0,
            y: 400,

            width: 1280,
            height: 210,

            color: "#202830",

            layer: RenderLayer.RoomBackground
        },
        {
            id: "sunglasses-stand-visual",
            x: 80,
            y: 260,
            width: 120,
            height: 180,
            color: "#8a6931",
            label: "Anteojos"
        },
        {
            id: "fede-visual",
            x: 760,
            y: 210,
            width: 120,
            height: 250,
            color: "#315d8a",
            label: "Fede"
        },
        {
            id: "gon-visual",
            x: 960,
            y: 210,
            width: 120,
            height: 250,
            color: "#7a3f69",
            label: "Gon"
        }
    ],    
    hotspots: [
        {
            id: "sunglasses-stand",
            x: 80,
            y: 260,
            width: 120,
            height: 180
        },
        {
            id: "fede",
            x: 760,
            y: 210,
            width: 120,
            height: 250
        },
        {
            id: "gon",
            x: 960,
            y: 210,
            width: 120,
            height: 250
        }
    ]
};
