import type { GameState } from "../state/GameState";
import type { Inventory } from "../inventory/Inventory";
import type {
    GameCondition,
    GameEffect
} from "./GameRuleData";

export class GameRuleEvaluator {
    private readonly state: GameState;

    private readonly inventory: Inventory;

    public constructor(state: GameState, inventory: Inventory) {
        this.state = state;
        this.inventory = inventory;
    }

    public matchesAll(conditions: readonly GameCondition[]): boolean {
        return conditions.every((condition) => this.matches(condition));
    }

    public applyAll(effects: readonly GameEffect[]): void {
        for (const effect of effects) {
            switch (effect.type) {
                case "setState":
                    this.state.apply(effect);
                    break;

                case "giveItem":
                    this.inventory.add(effect.itemId);
                    break;
            }
        }
    }

    private matches(condition: GameCondition): boolean {
        switch (condition.type) {
            case "state":
                return this.state.matches(condition);

            case "hasItem":
                return this.inventory.has(condition.itemId) === condition.value;
        }
    }
}
