import type { PointerPosition } from "../input/InputManager";
import {
    containsPoint,
    type Rectangle
} from "./Rectangle";

export interface MessageInteraction {
    type: "message";
    message: string;
}

export interface ChangeRoomInteraction {
    type: "changeRoom";
    roomId: string;
}

export interface GoBackInteraction {
    type: "goBack";
}

export interface StartDialogueInteraction {
    type: "startDialogue";
    dialogueId: string;
}

export type HotspotInteraction =
    | MessageInteraction
    | ChangeRoomInteraction
    | GoBackInteraction
    | StartDialogueInteraction;

export interface HotspotOptions extends Rectangle {
    id: string;
    interaction?: HotspotInteraction;
}

export class Hotspot {
    public readonly id: string;

    public readonly bounds: Rectangle;

    public readonly interaction: HotspotInteraction | null;

    public constructor(options: HotspotOptions) {
        this.id = options.id;

        this.bounds = {
            x: options.x,
            y: options.y,
            width: options.width,
            height: options.height
        };

        this.interaction = options.interaction ?? null;
    }

    public contains(position: PointerPosition): boolean {
        return containsPoint(this.bounds, position);
    }
}
