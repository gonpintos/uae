import type {
    StateCondition,
    StateEffect
} from "../state/GameStateData";

export interface DialogueSpeakerData {
    id: string;
    name: string;
}

export interface DialogueOptionData {
    id: string;
    playerLine: string;
    npcLine?: string;
    playerClosingLine?: string;
    endsConversation?: boolean;
    conditions?: readonly StateCondition[];
    effects?: readonly StateEffect[];
}

export interface DialogueData {
    id: string;
    player: DialogueSpeakerData;
    npc: DialogueSpeakerData;
    options: readonly DialogueOptionData[];
}
