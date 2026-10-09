import type { Room } from "./Room";
import type { RoomCollection } from "./RoomCollection";

export class RoomManager {
    private readonly rooms: RoomCollection;

    private activeRoom: Room;

    private lastRoom: Room | null = null;

    public constructor(
        rooms: RoomCollection,
        initialRoomId: string
    ) {
        this.rooms = rooms;
        this.activeRoom = rooms.getById(initialRoomId);
    }

    public get currentRoom(): Room {
        return this.activeRoom;
    }

    public get previousRoom(): Room | null {
        return this.lastRoom;
    }

    public changeRoom(roomId: string): Room {
        const nextRoom = this.rooms.getById(roomId);

        this.lastRoom = this.activeRoom;
        this.activeRoom = nextRoom;

        return this.activeRoom;
    }

    public goBack(): Room {
        if (!this.lastRoom) {
            throw new Error("There is no previous room.");
        }

        const destination = this.lastRoom;

        this.lastRoom = this.activeRoom;
        this.activeRoom = destination;

        return this.activeRoom;
    }
}