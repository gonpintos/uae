export interface MessageInteractionResult {
    type: "message";
    message: string;
}

export interface ChangeRoomInteractionResult {
    type: "changeRoom";
    message: string;
}

export interface GoBackInteractionResult {
    type: "goBack";
    message: string;
}

export interface StartDialogueInteractionResult {
    type: "startDialogue";
    dialogueId: string;
}

export type InteractionResult =
    | MessageInteractionResult
    | ChangeRoomInteractionResult
    | GoBackInteractionResult
    | StartDialogueInteractionResult;
