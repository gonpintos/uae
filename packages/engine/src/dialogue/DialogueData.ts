import type {
    GameCondition,
    GameEffect
} from "../rules/GameRuleData";

export interface DialogueSpeakerData {
    id: string;
    name: string;
}

export type DialogueCondition = GameCondition;

export type DialogueEffect = GameEffect;

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
