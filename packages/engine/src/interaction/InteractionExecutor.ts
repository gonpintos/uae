import type { RoomManager } from "../room/RoomManager";
import type { GameState } from "../state/GameState";
import type { Inventory } from "../inventory/Inventory";
import { GameRuleEvaluator } from "../rules/GameRuleEvaluator";
import type { VerbId } from "../verb/VerbData";
import type { InteractionAction } from "./InteractionAction";
import type { InteractionResult } from "./InteractionResult";
import type { VerbInteractionCollection } from "./VerbInteractionCollection";

export class InteractionExecutor {
    private readonly roomManager: RoomManager;

    private readonly interactions: VerbInteractionCollection;

    private readonly rules: GameRuleEvaluator;

    public constructor(
        roomManager: RoomManager,
        interactions: VerbInteractionCollection,
        state: GameState,
        inventory: Inventory
    ) {
        this.roomManager = roomManager;
        this.interactions = interactions;
        this.rules = new GameRuleEvaluator(state, inventory);
    }

    public execute(
        verb: VerbId,
        targetId: string
    ): InteractionResult {
        const definition = this.interactions
            .getCandidates(verb, targetId)
            .find((candidate) =>
                this.rules.matchesAll(candidate.conditions ?? [])
            );

        if (!definition) {
            return {
                type: "unhandled",
                verb,
                targetId,
                message: "Todavía no hay una interacción definida."
            };
        }

        this.rules.applyAll(definition.effects ?? []);

        return this.executeInteraction(definition.interaction);
    }

    private executeInteraction(
        interaction: InteractionAction
    ): InteractionResult {
        switch (interaction.type) {
            case "message":
                return {
                    type: "message",
                    message: interaction.message
                };

            case "say":
                return {
                    type: "say",
                    actorId: interaction.actorId,
                    message: interaction.message
                };

            case "changeRoom": {
                const room =
                    this.roomManager.changeRoom(
                        interaction.roomId
                    );

                return {
                    type: "changeRoom",
                    message: `Entered: ${room.name}`
                };
            }
            
            case "goBack": {
                const room = this.roomManager.goBack();

                return {
                    type: "goBack",
                    message: `Returned to: ${room.name}`
                };
            }

            case "startDialogue":
                return {
                    type: "startDialogue",
                    dialogueId: interaction.dialogueId
                };

            case "triggerAction":
                return {
                    type: "triggerAction",
                    actionId: interaction.actionId,
                    message: `Action ready: ${interaction.actionId}`
                };
        }
    }
}
