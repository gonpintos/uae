import { Room } from "./Room";
import type { RoomData } from "./RoomData";

export class RoomCollection {
    private readonly rooms: Map<string, Room>;

    public constructor(roomDataList: RoomData[]) {
        this.rooms = new Map(
            roomDataList.map((roomData) => {
                const room = new Room(roomData);

                return [room.id, room];
            })
        );
    }

    public getById(roomId: string): Room {
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error(`Room not found: ${roomId}`);
        }

        return room;
    }
}