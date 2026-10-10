import type { Inventory } from "../inventory/Inventory";
import type { PointerButton } from "../input/InputManager";
import type { GameState } from "../state/GameState";
import type { VerbId } from "../verb/VerbData";
import type { GameCondition } from "../rules/GameRuleData";
import { GameRuleEvaluator } from "../rules/GameRuleEvaluator";

export interface ConditionalDefaultVerb {
    verb: VerbId;
    conditions?: readonly GameCondition[];
}

export type DefaultVerb = VerbId | readonly ConditionalDefaultVerb[];

export class DefaultVerbResolver {
    private readonly rules: GameRuleEvaluator;

    public constructor(state: GameState, inventory: Inventory) {
        this.rules = new GameRuleEvaluator(state, inventory);
    }

    public resolve(definition: DefaultVerb | null | undefined): VerbId | null {
        if (!definition) {
            return null;
        }

        if (typeof definition === "string") {
            return definition;
        }

        return definition.find((candidate) =>
            this.rules.matchesAll(candidate.conditions ?? [])
        )?.verb ?? null;
    }

    public resolveTarget(
        button: PointerButton,
        selectedVerb: VerbId,
        definition: DefaultVerb | null | undefined
    ): VerbId | null {
        return button === "primary"
            ? selectedVerb
            : this.resolve(definition);
    }
}
