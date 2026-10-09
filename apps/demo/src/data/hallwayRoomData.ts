import type { RoomData } from "@uae/engine";

export const hallwayRoomData: RoomData = {
    id: "hallway",
    name: "Hallway",

    visuals: [
        {
            id: "return-door-visual",
            x: 80,
            y: 180,
            width: 160,
            height: 300,
            color: "#5c4033",
            label: "Return door"
        },
        {
            id: "painting-visual",
            x: 400,
            y: 180,
            width: 180,
            height: 140,

            imageAssetId: "room.painting"
        }
    ],

    hotspots: [
        {
            id: "return-door",
            x: 80,
            y: 180,
            width: 160,
            height: 300,
            interaction: {
                type: "goBack"
            }
        },
        {
            id: "painting",
            x: 400,
            y: 180,
            width: 180,
            height: 140,
            interaction: {
                type: "message",
                message: "An unsettling portrait watches you."
            }
        }
    ]
};