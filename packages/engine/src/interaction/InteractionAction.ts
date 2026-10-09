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

export interface TriggerActionInteraction {
    type: "triggerAction";
    actionId: string;
}

export type InteractionAction =
    | MessageInteraction
    | ChangeRoomInteraction
    | GoBackInteraction
    | StartDialogueInteraction
    | TriggerActionInteraction;
