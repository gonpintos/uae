import type {
    DialogueData,
    DialogueOptionData
} from "./DialogueData";

export class DialogueCollection {
    private readonly dialogues: Map<string, DialogueData>;

    public constructor(dialogues: readonly DialogueData[]) {
        this.dialogues = new Map();

        for (const dialogue of dialogues) {
            if (this.dialogues.has(dialogue.id)) {
                throw new Error(`Duplicate dialogue id: ${dialogue.id}`);
            }

            this.assertUniqueOptionIds(dialogue);
            this.dialogues.set(dialogue.id, dialogue);
        }
    }

    public getById(dialogueId: string): DialogueData {
        const dialogue = this.dialogues.get(dialogueId);

        if (!dialogue) {
            throw new Error(`Dialogue not found: ${dialogueId}`);
        }

        return dialogue;
    }

    private assertUniqueOptionIds(dialogue: DialogueData): void {
        const optionIds = new Set<string>();

        for (const option of dialogue.options) {
            this.assertUniqueOptionId(dialogue.id, option, optionIds);
        }
    }

    private assertUniqueOptionId(
        dialogueId: string,
        option: DialogueOptionData,
        optionIds: Set<string>
    ): void {
        if (optionIds.has(option.id)) {
            throw new Error(
                `Duplicate option id in dialogue ${dialogueId}: ${option.id}`
            );
        }

        optionIds.add(option.id);
    }
}
