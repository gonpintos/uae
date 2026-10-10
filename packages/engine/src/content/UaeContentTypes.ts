import type { ActorData } from "../actor/ActorData";
import type { AssetDefinitions } from "../assets/AssetCatalog";
import type { DialogueData } from "../dialogue/DialogueData";
import type { IntroData } from "../intro/IntroData";
import type { VerbInteractionData } from "../interaction/VerbInteractionData";
import type { InventoryItemData } from "../inventory/InventoryItemData";
import type { RoomData } from "../room/RoomData";
import type { ActionSequenceData } from "../sequence/ActionSequenceData";
import type { GameStateData, GameStateValue } from "../state/GameStateData";
import type { VerbData } from "../verb/VerbData";

export interface UaeSourceText {
    fileName: string;
    text: string;
}

export interface UaeSceneRegistration {
    id: string;
    source: string;
}

export interface UaeStateDeclaration {
    type: "boolean" | "number" | "string";
    initial?: GameStateValue;
}

export interface UaeGameManifest {
    format: "uae-game";
    version: 1;
    id: string;
    title: string;
    resolution: {width: number; height: number};
    start: {scene: string; intro?: string};
    scenes: UaeSceneRegistration[];
    assetBasePath: string;
    assets: Record<string, string>;
    verbs: Array<{id: string; label: string; default?: boolean}>;
    items: UaeItemData[];
    initialInventory: string[];
    state: Record<string, UaeStateDeclaration>;
    intros: UaeIntroData[];
}

export interface UaeItemData {
    id: string;
    displayName: string;
    description?: string;
    defaultVerb?: UaeDefaultVerb;
    icon?: {asset: string; width: number; height: number};
}

export interface UaeIntroData {
    id: string;
    backgroundColor?: string;
    textColor?: string;
    screens: Array<Record<string, unknown>>;
}

export interface UaePoint {x: number; y: number}
export interface UaeBounds extends UaePoint {width: number; height: number}

export interface UaeStateCondition {
    type: "state";
    key: string;
    operator: "equals" | "notEquals";
    value: GameStateValue;
}

export interface UaeHasItemCondition {
    type: "hasItem";
    item: string;
    value: boolean;
}

export type UaeCondition = UaeStateCondition | UaeHasItemCondition;

export interface UaeSetStateEffect {
    type: "setState";
    key: string;
    value: GameStateValue;
}

export interface UaeGiveItemEffect {
    type: "giveItem";
    item: string;
}

export type UaeEffect = UaeSetStateEffect | UaeGiveItemEffect;

export type UaeDefaultVerb = string | Array<{
    verb: string;
    conditions?: UaeCondition[];
}>;

export interface UaeVisualData {
    asset?: string;
    bounds?: UaeBounds;
    size?: {width: number; height: number};
    animations?: {
        sourceFacing?: "left" | "right";
        idle: {frames: string[]; frameDurationMs?: number};
        walk?: {frames: string[]; frameDurationMs?: number};
    };
}

export interface UaeEntityData {
    id: string;
    kind: "actor" | "object";
    displayName: string;
    position?: UaePoint;
    speechColor?: string;
    walkSpeedPixelsPerSecond?: number;
    initialFacing?: "left" | "right";
    visual: UaeVisualData;
    hotspot?: true | {bounds: UaeBounds};
    defaultVerb?: UaeDefaultVerb;
    interactionPosition?: UaePoint;
    depthY?: number;
}

export interface UaeRoomData {
    id: string;
    name: string;
    visuals: Array<{
        id: string;
        asset?: string;
        bounds: UaeBounds;
        layer?: "background" | "roomBackground" | "roomObject" | "roomForeground";
        depthY?: number;
        alpha?: number;
    }>;
    walkableArea: Record<string, unknown>;
}

export type UaeInteractionAction =
    | {type: "message"; text: string}
    | {type: "say"; actor: string; text: string}
    | {type: "startDialogue"; dialogue: string}
    | {type: "triggerSequence"; sequence: string};

export interface UaeInteractionData {
    verb: string;
    target: string;
    conditions?: UaeCondition[];
    effects?: UaeEffect[];
    action: UaeInteractionAction;
}

export interface UaeDialogueOptionData {
    id: string;
    playerLine: string;
    npcLine?: string;
    playerClosingLine?: string;
    conditions?: UaeCondition[];
    effects?: UaeEffect[];
    goto?: string;
    endDialogue?: boolean;
}

export interface UaeDialogueData {
    id: string;
    player: string;
    npc: string;
    start: string;
    nodes: Record<string, {options: UaeDialogueOptionData[]}>;
}

export type UaeSequenceAction =
    | {type: "wait"; durationMs: number}
    | {type: "say"; actor: string; text: string}
    | {type: "moveTo"; actor: string; x: number; y: number; durationMs?: number}
    | {type: "moveBySteps"; actor: string; steps: number; deltaX: number; deltaY: number; stepDurationMs?: number}
    | {type: "showTitle"; text: string}
    | {type: "endScene"};

export interface UaeSequenceData {
    id: string;
    ui?: "hidden";
    actions: UaeSequenceAction[];
}

export interface UaeSceneDocument {
    format: "uae-scene";
    version: 1;
    id: string;
    name: string;
    controlledActor: string;
    entry?: {sequence: string; once?: boolean};
    room: UaeRoomData;
    entities: UaeEntityData[];
    interactions: UaeInteractionData[];
    dialogues: UaeDialogueData[];
    sequences: UaeSequenceData[];
}

export interface UaeRuntimeSceneData {
    id: string;
    rooms: RoomData[];
    initialRoomId: string;
    actors: ActorData[];
    interactions: VerbInteractionData[];
    dialogues: DialogueData[];
    sequences: ActionSequenceData[];
    controlledActorId: string;
    entry: {sequenceId: string; once: boolean} | null;
}

export interface UaeLoadedGame {
    id: string;
    title: string;
    resolution: {width: number; height: number};
    assets: AssetDefinitions;
    requiredAssetIds: string[];
    verbs: VerbData[];
    items: InventoryItemData[];
    initialInventoryItemIds: string[];
    initialState: GameStateData;
    intro: IntroData | null;
    initialScene: UaeRuntimeSceneData;
}
