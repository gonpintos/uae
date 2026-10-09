import type {
    StateCondition,
    StateEffect
} from "../state/GameStateData";

export interface HasItemCondition {
    type: "hasItem";
    itemId: string;
    value: boolean;
}

export interface GiveItemEffect {
    type: "giveItem";
    itemId: string;
}

export type GameCondition = StateCondition | HasItemCondition;

export type GameEffect = StateEffect | GiveItemEffect;
