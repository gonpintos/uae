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
    gotoNodeId?: string;
    conditions?: readonly DialogueCondition[];
    effects?: readonly DialogueEffect[];
}

export interface DialogueNodeData {
    id: string;
    options: readonly DialogueOptionData[];
}

export interface DialogueData {
    id: string;
    player: DialogueSpeakerData;
    npc: DialogueSpeakerData;
    /** Legacy flat dialogue options. */
    options?: readonly DialogueOptionData[];
    /** Node graph used by UAE Scene Format v1. */
    nodes?: readonly DialogueNodeData[];
    startNodeId?: string;
}
