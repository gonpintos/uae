import type {
    GameCondition,
    GameEffect
} from "../rules/GameRuleData";
import type { VerbId } from "../verb/VerbData";
import type { InteractionAction } from "./InteractionAction";

export interface VerbInteractionData {
    verb: VerbId;
    targetId: string;
    interaction: InteractionAction;
    conditions?: readonly GameCondition[];
    effects?: readonly GameEffect[];
}
