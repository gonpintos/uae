import type { VerbId } from "../verb/VerbData";

export interface MessageInteractionResult {
    type: "message";
    message: string;
}

export interface SayInteractionResult {
    type: "say";
    actorId: string;
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

export interface TriggerActionInteractionResult {
    type: "triggerAction";
    actionId: string;
    message: string;
}

export interface UnhandledInteractionResult {
    type: "unhandled";
    verb: VerbId;
    targetId: string;
    message: string;
}

export type InteractionResult =
    | MessageInteractionResult
    | SayInteractionResult
    | ChangeRoomInteractionResult
    | GoBackInteractionResult
    | StartDialogueInteractionResult
    | TriggerActionInteractionResult
    | UnhandledInteractionResult;

