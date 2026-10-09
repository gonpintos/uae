import type { RoomManager } from "../room/RoomManager";
import type { HotspotInteraction } from "./Hotspot";
import type { InteractionResult } from "./InteractionResult";

export class InteractionExecutor {
    private readonly roomManager: RoomManager;

    public constructor(roomManager: RoomManager) {
        this.roomManager = roomManager;
    }

    public execute(
        interaction: HotspotInteraction
    ): InteractionResult {
        switch (interaction.type) {
            case "message":
                return {
                    type: "message",
                    message: interaction.message
                };

            case "changeRoom": {
                const room =
                    this.roomManager.changeRoom(
                        interaction.roomId
                    );

                return {
                    type: "changeRoom",
                    message: `Entered: ${room.name}`
                };
            }
            
            case "goBack": {
                const room = this.roomManager.goBack();

                return {
                    type: "goBack",
                    message: `Returned to: ${room.name}`
                };
            }

            case "startDialogue":
                return {
                    type: "startDialogue",
                    dialogueId: interaction.dialogueId
                };
        }
    }
}
