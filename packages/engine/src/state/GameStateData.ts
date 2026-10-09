export type GameStateValue = boolean | number | string;

export type GameStateData = Readonly<Record<string, GameStateValue>>;

export type StateConditionOperator = "equals" | "notEquals";

export interface StateCondition {
    key: string;
    operator: StateConditionOperator;
    value: GameStateValue;
}

export interface SetStateEffect {
    type: "setState";
    key: string;
    value: GameStateValue;
}

export type StateEffect = SetStateEffect;
