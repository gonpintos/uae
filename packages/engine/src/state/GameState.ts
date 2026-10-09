import type {
    GameStateData,
    GameStateValue,
    StateCondition,
    StateEffect
} from "./GameStateData";

export class GameState {
    private readonly values = new Map<string, GameStateValue>();

    public constructor(initialState: GameStateData = {}) {
        for (const [key, value] of Object.entries(initialState)) {
            this.values.set(key, value);
        }
    }

    public getValue(key: string): GameStateValue | undefined {
        return this.values.get(key);
    }

    public setValue(key: string, value: GameStateValue): void {
        this.values.set(key, value);
    }

    public getFlag(key: string): boolean {
        return this.values.get(key) === true;
    }

    public setFlag(key: string, value = true): void {
        this.values.set(key, value);
    }

    public matches(condition: StateCondition): boolean {
        const currentValue = this.values.get(condition.key);

        switch (condition.operator) {
            case "equals":
                return currentValue === condition.value;

            case "notEquals":
                return currentValue !== condition.value;
        }
    }

    public matchesAll(conditions: readonly StateCondition[]): boolean {
        return conditions.every((condition) => this.matches(condition));
    }

    public apply(effect: StateEffect): void {
        switch (effect.type) {
            case "setState":
                this.setValue(effect.key, effect.value);
        }
    }

    public toData(): GameStateData {
        return Object.fromEntries(this.values);
    }
}
