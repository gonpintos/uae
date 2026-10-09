import { RenderLayer, type RoomData } from "@uae/engine";

export const demoRoomData: RoomData = {
    id: "demo-room",
    name: "Demo Room",
    visuals: [
        {
            id: "window-visual",
            x: 250,
            y: 180,
            width: 150,
            height: 180,
            color: "#294c60",
            label: "Window"
        },
        {
            id: "door-visual",
            x: 500,
            y: 180,
            width: 160,
            height: 300,
            color: "#5c4033",
            label: "Door"
        },
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
            id: "window",
            x: 250,
            y: 180,
            width: 150,
            height: 180,
            interaction: {
                type: "message",
                message: "It is raining outside."
            }
        },
        {
            id: "door",
            x: 500,
            y: 180,
            width: 160,
            height: 300,
            interaction: {
                type: "changeRoom",
                roomId: "hallway"
            }
        },
        {
            id: "fede",
            x: 760,
            y: 210,
            width: 120,
            height: 250,
            interaction: {
                type: "startDialogue",
                dialogueId: "fede-sunglasses"
            }
        },
        {
            id: "gon",
            x: 960,
            y: 210,
            width: 120,
            height: 250,
            interaction: {
                type: "startDialogue",
                dialogueId: "gon-sunglasses"
            }
        }
    ]
};
