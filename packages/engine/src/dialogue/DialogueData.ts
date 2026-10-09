import type {
    StateCondition,
    StateEffect
} from "../state/GameStateData";

export interface DialogueSpeakerData {
    id: string;
    name: string;
}

export interface HasItemCondition {
    type: "hasItem";
    itemId: string;
    value: boolean;
}

export interface GiveItemEffect {
    type: "giveItem";
    itemId: string;
}

export type DialogueCondition = StateCondition | HasItemCondition;

export type DialogueEffect = StateEffect | GiveItemEffect;

export interface DialogueOptionData {
    id: string;
    playerLine: string;
    npcLine?: string;
    playerClosingLine?: string;
    endsConversation?: boolean;
    conditions?: readonly DialogueCondition[];
    effects?: readonly DialogueEffect[];
}

export interface DialogueData {
    id: string;
    player: DialogueSpeakerData;
    npc: DialogueSpeakerData;
    options: readonly DialogueOptionData[];
}
