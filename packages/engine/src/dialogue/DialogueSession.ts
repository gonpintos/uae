import type { DialogueCollection } from "./DialogueCollection";
import type {
    DialogueCondition,
    DialogueData,
    DialogueEffect,
    DialogueOptionData,
    DialogueSpeakerData
} from "./DialogueData";
import type { GameState } from "../state/GameState";
import type { Inventory } from "../inventory/Inventory";

export interface DialogueTurn {
    playerLine: string;
    npcLine: string | null;
    playerClosingLine: string | null;
}

export interface DialogueView {
    dialogueId: string;
    player: DialogueSpeakerData;
    npc: DialogueSpeakerData;
    options: readonly DialogueOptionData[];
    lastTurn: DialogueTurn | null;
}

export interface DialogueSelectionResult {
    turn: DialogueTurn;
    ended: boolean;
}

export class DialogueSession {
    private readonly dialogues: DialogueCollection;

    private readonly state: GameState;

    private readonly inventory: Inventory;

    private activeDialogue: DialogueData | null = null;

    private lastTurn: DialogueTurn | null = null;

    public constructor(
        dialogues: DialogueCollection,
        state: GameState,
        inventory: Inventory
    ) {
        this.dialogues = dialogues;
        this.state = state;
        this.inventory = inventory;
    }

    public get isActive(): boolean {
        return this.activeDialogue !== null;
    }

    public get view(): DialogueView | null {
        if (!this.activeDialogue) {
            return null;
        }

        return {
            dialogueId: this.activeDialogue.id,
            player: this.activeDialogue.player,
            npc: this.activeDialogue.npc,
            options: this.getVisibleOptions(this.activeDialogue),
            lastTurn: this.lastTurn
        };
    }

    public start(dialogueId: string): void {
        this.activeDialogue = this.dialogues.getById(dialogueId);
        this.lastTurn = null;
    }

    public selectOption(optionId: string): DialogueSelectionResult {
        if (!this.activeDialogue) {
            throw new Error("There is no active dialogue.");
        }

        const option = this.getVisibleOptions(this.activeDialogue).find(
            (candidate) => candidate.id === optionId
        );

        if (!option) {
            throw new Error(
                `Dialogue option not found in ${this.activeDialogue.id}: ${optionId}`
            );
        }

        const turn: DialogueTurn = {
            playerLine: option.playerLine,
            npcLine: option.npcLine ?? null,
            playerClosingLine: option.playerClosingLine ?? null
        };

        for (const effect of option.effects ?? []) {
            this.applyEffect(effect);
        }

        if (option.endsConversation) {
            this.activeDialogue = null;
            this.lastTurn = null;

            return {
                turn,
                ended: true
            };
        }

        this.lastTurn = turn;

        return {
            turn,
            ended: false
        };
    }

    private getVisibleOptions(
        dialogue: DialogueData
    ): readonly DialogueOptionData[] {
        return dialogue.options.filter((option) =>
            (option.conditions ?? []).every(
                (condition) => this.matchesCondition(condition)
            )
        );
    }

    private matchesCondition(condition: DialogueCondition): boolean {
        switch (condition.type) {
            case "state":
                return this.state.matches(condition);

            case "hasItem":
                return this.inventory.has(condition.itemId) === condition.value;
        }
    }

    private applyEffect(effect: DialogueEffect): void {
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
